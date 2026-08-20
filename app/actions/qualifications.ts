'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper to parse dates like "24-Mar-25" or "2020-12-21" or "12/21/2020"
function parseFlexibleDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr || String(dateStr).trim() === '') return null;
    try {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) return parsed;
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

const parseSafeFloat = (val: any) => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
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

export async function processQualificationsUpload(data: any[]) {
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

            return {
                // To avoid foreign key constraint errors, we ONLY set empID if the employee exists in the database.
                empID: matchedEmployee ? matchedEmployee.id : null,
                subjectId: parseSafeString(item['Subject ID'] || item.subjectId || item.subject_id),
                altSubjectName: parseSafeString(item['Alt Subject Name'] || item.altSubjectName),
                qualificationType: parseSafeString(item['Qualification Type'] || item.qualificationType),
                facilitator: parseSafeString(item['Facilitator'] || item.facilitator || item['Examiner Name']),
                enrollmentDate: parseFlexibleDate(item['Date Of Enrollment'] || item['enrollment Date'] || item.enrollmentDate),
                testDate: parseFlexibleDate(item['Date of Completion'] || item['Test Date'] || item.testDate),
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
                month: parseSafeString(item['MTH'] || item.month),
                year: parseSafeString(item['Year'] || item.year),
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
