'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper to parse dates like "24-Mar-25" or "2020-12-21" or "12/21/2020"
function parseFlexibleDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr || String(dateStr).trim() === '') return null;
    try {
        let cleanStr = String(dateStr).trim();
        
        // Handle DD-MM-YYYY or DD/MM/YYYY
        const parts = cleanStr.split(/[-/]/);
        if (parts.length === 3 && parts[2].length >= 2) {
            const p1 = parseInt(parts[0], 10);
            const p2 = parseInt(parts[1], 10);
            const p3 = parseInt(parts[2], 10);
            
            // If it's all numbers
            if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
                let year = p3;
                if (year < 100) year += 2000; // handle 2-digit year
                
                // Assume DD-MM-YYYY since it's an Indian app, 
                // UNLESS it's YYYY-MM-DD (first part is year)
                if (p1 > 1000) {
                    cleanStr = `${p1}-${p2}-${p3}`;
                } else {
                    // It's either DD-MM-YYYY or MM-DD-YYYY. Default to DD-MM-YYYY
                    cleanStr = `${year}-${p2}-${p1}`;
                }
            }
        }

        const parsed = new Date(cleanStr);
        if (!isNaN(parsed.getTime())) return parsed;

        // Fallback to original string
        const parsedOrig = new Date(String(dateStr).trim());
        if (!isNaN(parsedOrig.getTime())) return parsedOrig;
    } catch {
        // ignore
    }
    return null;
}

function parseBoolean(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
        const lower = val.trim().toLowerCase();
        return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'pass';
    }
    return false;
}

const parseSafeString = (val: any) => {
    if (val === null || val === undefined || val === '') return null;
    return String(val);
};

const parseSafeFloat = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(String(val).trim());
    return isNaN(num) ? null : num;
};

const parseSafeBoolean = (val: any) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
        const lower = val.trim().toLowerCase();
        return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'pass';
    }
    return false;
};

export async function bulkUploadQualifications(data: any[]) {
    try {
        // Extract unique IDs and Names to fetch from master Employee table
        const providedIds = Array.from(new Set(data.map(item => item['Emp ID'] || item.empID || item.EmpId || item.empId).filter(Boolean)));
        const providedNames = Array.from(new Set(data.map(item => item['Emp Name'] || item.empName).filter(Boolean)));

        let employeeMap = new Map<string, any>();
        
        if (providedIds.length > 0 || providedNames.length > 0) {
            const matchedEmployees = await db.employee.findMany({
                where: {
                    OR: [
                        { id: { in: providedIds.map(String) } },
                        { name: { in: providedNames.map(String) } }
                    ]
                }
            });

            matchedEmployees.forEach(emp => {
                employeeMap.set(`id:${emp.id.toLowerCase()}`, emp);
                employeeMap.set(`name:${emp.name.toLowerCase()}`, emp);
            });
        }

        const formattedData = data.map((item) => {
            const rawId = item['Emp ID'] || item.empID || item.EmpId || item.empId;
            const rawName = item['Emp Name'] || item.empName;
            
            let matchedEmployee = null;
            if (rawId) {
                matchedEmployee = employeeMap.get(`id:${String(rawId).toLowerCase()}`);
            }
            if (!matchedEmployee && rawName) {
                matchedEmployee = employeeMap.get(`name:${String(rawName).toLowerCase()}`);
            }

            const enrollmentDate = parseFlexibleDate(item['Date Of Enrollment'] || item['enrollment Date'] || item.enrollmentDate);
            const testDate = parseFlexibleDate(item['Date of Completion'] || item['Test Date'] || item.testDate);

            let derivedMonth = null;
            let derivedYear = null;
            
            const dateToUse = testDate || enrollmentDate;
            if (dateToUse) {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                derivedMonth = monthNames[dateToUse.getMonth()];
                
                const fullYear = dateToUse.getFullYear();
                const currentMonth = dateToUse.getMonth(); // 0-11
                let startYear, endYear;
                if (currentMonth < 3) {
                    startYear = fullYear - 1;
                    endYear = fullYear;
                } else {
                    startYear = fullYear;
                    endYear = fullYear + 1;
                }
                derivedYear = `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
            }

            return {
                // To avoid foreign key constraint errors, we ONLY set empID if the employee exists in the database.
                empID: matchedEmployee ? matchedEmployee.id : null,
                subjectId: parseSafeString(item['Subject ID'] || item.subjectId || item.subject_id || item.programId),
                altSubjectName: parseSafeString(item['Alt Subject Name'] || item.altSubjectName),
                qualificationType: parseSafeString(item['Qualification Type'] || item.qualificationType),
                facilitator: parseSafeString(item['Facilitator'] || item.facilitator || item['Examiner Name']),
                enrollmentDate,
                testDate,
                duration: parseSafeString(item['Duration'] || item['LMS Program Hours Spent'] || item.duration),
                maxMarks: parseSafeFloat(item['Max Marks'] ?? item.maxMarks),
                obtainedMarks: parseSafeFloat(item['Marks Attained'] || item['Marks attaind/ Grade'] || item.obtainedMarks),
                qualified: item['Qualified'] !== undefined ? parseSafeBoolean(item['Qualified']) : (item['Pass'] !== undefined ? parseSafeBoolean(item['Pass']) : null),
                referenceRemarks: parseSafeString(item['Reference / Remarks'] || item['Test Prog Reference'] || item.referenceRemarks),
                empLocation: parseSafeString(item['Emp Location'] || item.empLocation || (matchedEmployee ? matchedEmployee.location : null)),
                subjectName: parseSafeString(item['Subject name'] || item['LMS Program Name'] || item['Test Subject Name'] || item.subjectName),
                empName: parseSafeString(rawName || (matchedEmployee ? matchedEmployee.name : null)),
                designation: parseSafeString(item['Designation'] || item.designation || (matchedEmployee ? matchedEmployee.designation : null)),
                empGroup: parseSafeString(item['Emp Group'] || item.empGroup || (matchedEmployee ? matchedEmployee.employeeGrouupMNmw : null)),
                gender: parseSafeString(item['Gender'] || item.gender || (matchedEmployee ? matchedEmployee.gender : null)),
                shortProgReference: parseSafeString(item['Short Prog Reference'] || item['Key Word'] || item.shortProgReference),
                month: parseSafeString(item['MTH'] || item.month) || derivedMonth,
                year: parseSafeString(item['Year'] || item.year) || derivedYear,
            };
        });

        const result = await db.qualifications.createMany({
            data: formattedData,
        });
        
        revalidatePath('/admin/tests-qualifications');
        return { success: true, count: result.count };
    } catch (error: any) {
        console.error('Error in bulk upload:', error);
        return { success: false, error: error.message || 'Failed to bulk upload' };
    }
}

export async function deleteQualification(id: number) {
    try {
        await db.qualifications.delete({
            where: { id }
        });
        revalidatePath('/admin/tests-qualifications');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting qualification:', error);
        return { success: false, error: error.message || 'Failed to delete' };
    }
}

export async function clearQualifications() {
    try {
        const result = await db.qualifications.deleteMany({});
        revalidatePath('/admin/tests-qualifications');
        return { success: true, count: result.count };
    } catch (error: any) {
        console.error('Error clearing qualifications:', error);
        return { success: false, error: error.message || 'Failed to clear database' };
    }
}
