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

function deriveFiscalPeriod(date: Date | null) {
    if (!date) return { month: null, year: null };
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const fullYear = date.getFullYear();
    const currentMonth = date.getMonth(); // 0-11
    let startYear, endYear;
    if (currentMonth < 3) {
        startYear = fullYear - 1;
        endYear = fullYear;
    } else {
        startYear = fullYear;
        endYear = fullYear + 1;
    }
    const year = `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
    return { month, year };
}

async function getEmployeeLookup(data: any[]) {
    const providedIds = Array.from(new Set(data.map(item => item['Emp ID'] || item.empID || item.EmpId || item.empId).filter(Boolean)));
    const providedNames = Array.from(new Set(data.map(item => item['Emp Name'] || item.empName).filter(Boolean)));

    const employeeMap = new Map<string, any>();
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
    return employeeMap;
}

/**
 * Bulk upload specifically into the `test_records` table
 */
export async function bulkUploadTestRecords(data: any[]) {
    try {
        const employeeMap = await getEmployeeLookup(data);

        const formatted = data.map(item => {
            const rawId = item['Emp ID'] || item.empID || item.EmpId || item.empId;
            const rawName = item['Emp Name'] || item.empName;

            let matchedEmployee = null;
            if (rawId) matchedEmployee = employeeMap.get(`id:${String(rawId).toLowerCase()}`);
            if (!matchedEmployee && rawName) matchedEmployee = employeeMap.get(`name:${String(rawName).toLowerCase()}`);

            const testDate = parseFlexibleDate(item['Test Date'] || item['Date of Completion'] || item.testDate);
            const { month: derivedMonth, year: derivedYear } = deriveFiscalPeriod(testDate);

            return {
                empID: matchedEmployee ? matchedEmployee.id : null,
                subjectId: parseSafeString(item['Subject ID'] || item.subjectId || item.subject_id || item.programId),
                altSubjectName: parseSafeString(item['Alt Subject Name'] || item.altSubjectName),
                facilitator: parseSafeString(item['Facilitator'] || item.facilitator || item['Examiner Name']),
                testDate,
                duration: parseSafeString(item['Duration'] || item.duration),
                maxMarks: parseSafeFloat(item['Max Marks'] ?? item.maxMarks),
                obtainedMarks: parseSafeFloat(item['Marks Attained'] || item['Marks attaind/ Grade'] || item.obtainedMarks),
                qualified: item['Qualified'] !== undefined ? parseSafeBoolean(item['Qualified']) : (item['Pass'] !== undefined ? parseSafeBoolean(item['Pass']) : null),
                referenceRemarks: parseSafeString(item['Reference / Remarks'] || item['Test Prog Reference'] || item.referenceRemarks),
                empLocation: parseSafeString(item['Emp Location'] || item.empLocation || (matchedEmployee ? matchedEmployee.location : null)),
                subjectName: parseSafeString(item['Subject name'] || item['Test Subject Name'] || item.subjectName),
                empName: parseSafeString(rawName || (matchedEmployee ? matchedEmployee.name : null)),
                designation: parseSafeString(item['Designation'] || item.designation || (matchedEmployee ? matchedEmployee.designation : null)),
                empGroup: parseSafeString(item['Emp Group'] || item.empGroup || (matchedEmployee ? matchedEmployee.employeeGrouupMNmw : null)),
                gender: parseSafeString(item['Gender'] || item.gender || (matchedEmployee ? matchedEmployee.gender : null)),
                shortProgReference: parseSafeString(item['Short Prog Reference'] || item['Key Word'] || item.shortProgReference),
                month: parseSafeString(item['MTH'] || item.month) || derivedMonth,
                year: parseSafeString(item['Year'] || item.year) || derivedYear,
            };
        });

        const result = await db.testRecord.createMany({ data: formatted });
        revalidatePath('/admin/tests-qualifications');
        return { success: true, count: result.count };
    } catch (error: any) {
        console.error('Error in bulkUploadTestRecords:', error);
        return { success: false, error: error.message || 'Failed to upload test records' };
    }
}

/**
 * Bulk upload specifically into the `lms_records` table
 */
export async function bulkUploadLmsRecords(data: any[]) {
    try {
        const employeeMap = await getEmployeeLookup(data);

        const formatted = data.map(item => {
            const rawId = item['Emp ID'] || item.empID || item.EmpId || item.empId;
            const rawName = item['Emp Name'] || item.empName;

            let matchedEmployee = null;
            if (rawId) matchedEmployee = employeeMap.get(`id:${String(rawId).toLowerCase()}`);
            if (!matchedEmployee && rawName) matchedEmployee = employeeMap.get(`name:${String(rawName).toLowerCase()}`);

            const enrollmentDate = parseFlexibleDate(item['Date Of Enrollment'] || item['enrollment Date'] || item.enrollmentDate);
            const completionDate = parseFlexibleDate(item['Date of Completion'] || item['Completion Date'] || item['Test Date'] || item.completionDate);
            const { month: derivedMonth, year: derivedYear } = deriveFiscalPeriod(completionDate || enrollmentDate);

            return {
                empID: matchedEmployee ? matchedEmployee.id : null,
                courseId: parseSafeString(item['Course ID'] || item['Subject ID'] || item.courseId || item.subjectId),
                altCourseName: parseSafeString(item['Alt Course Name'] || item['Alt Subject Name'] || item.altCourseName),
                enrollmentDate,
                completionDate,
                duration: parseSafeString(item['Duration'] || item['LMS Program Hours Spent'] || item.duration),
                maxMarks: parseSafeFloat(item['Max Marks'] ?? item.maxMarks),
                obtainedMarks: parseSafeFloat(item['Marks Attained'] || item['Marks attaind/ Grade'] || item.obtainedMarks),
                qualified: item['Qualified'] !== undefined ? parseSafeBoolean(item['Qualified']) : (item['Pass'] !== undefined ? parseSafeBoolean(item['Pass']) : null),
                referenceRemarks: parseSafeString(item['Reference / Remarks'] || item.referenceRemarks),
                empLocation: parseSafeString(item['Emp Location'] || item.empLocation || (matchedEmployee ? matchedEmployee.location : null)),
                courseName: parseSafeString(item['Course Name'] || item['Subject name'] || item['LMS Program Name'] || item.courseName || item.subjectName),
                empName: parseSafeString(rawName || (matchedEmployee ? matchedEmployee.name : null)),
                designation: parseSafeString(item['Designation'] || item.designation || (matchedEmployee ? matchedEmployee.designation : null)),
                empGroup: parseSafeString(item['Emp Group'] || item.empGroup || (matchedEmployee ? matchedEmployee.employeeGrouupMNmw : null)),
                gender: parseSafeString(item['Gender'] || item.gender || (matchedEmployee ? matchedEmployee.gender : null)),
                shortProgReference: parseSafeString(item['Short Prog Reference'] || item.shortProgReference),
                month: parseSafeString(item['MTH'] || item.month) || derivedMonth,
                year: parseSafeString(item['Year'] || item.year) || derivedYear,
            };
        });

        const result = await db.lmsRecord.createMany({ data: formatted });
        revalidatePath('/admin/tests-qualifications');
        return { success: true, count: result.count };
    } catch (error: any) {
        console.error('Error in bulkUploadLmsRecords:', error);
        return { success: false, error: error.message || 'Failed to upload LMS records' };
    }
}

/**
 * Unified bulk upload that automatically categorizes rows into `test_records` or `lms_records`
 */
export async function bulkUploadQualifications(data: any[], targetTable?: 'auto' | 'tests' | 'lms') {
    try {
        if (!data || data.length === 0) return { success: true, count: 0 };

        if (targetTable === 'tests') {
            return await bulkUploadTestRecords(data);
        }
        if (targetTable === 'lms') {
            return await bulkUploadLmsRecords(data);
        }

        // Auto-detect per item or dataset
        const testItems: any[] = [];
        const lmsItems: any[] = [];

        for (const item of data) {
            const qType = String(item['Qualification Type'] || item.qualificationType || '').trim().toLowerCase();
            const isLms = qType.includes('lms') || 
                          item['LMS Program Hours Spent'] !== undefined || 
                          item['LMS Program Name'] !== undefined ||
                          (item['Date Of Enrollment'] && !item['Facilitator'] && !item['Max Marks']);

            if (isLms) {
                lmsItems.push(item);
            } else {
                testItems.push(item);
            }
        }

        let totalUploaded = 0;
        if (testItems.length > 0) {
            const testRes = await bulkUploadTestRecords(testItems);
            if (!testRes.success) throw new Error(testRes.error);
            totalUploaded += testRes.count || 0;
        }

        if (lmsItems.length > 0) {
            const lmsRes = await bulkUploadLmsRecords(lmsItems);
            if (!lmsRes.success) throw new Error(lmsRes.error);
            totalUploaded += lmsRes.count || 0;
        }

        revalidatePath('/admin/tests-qualifications');
        return { success: true, count: totalUploaded };
    } catch (error: any) {
        console.error('Error in bulkUploadQualifications:', error);
        return { success: false, error: error.message || 'Failed to bulk upload' };
    }
}

export async function deleteTestRecord(id: number) {
    try {
        await db.testRecord.delete({ where: { id } });
        revalidatePath('/admin/tests-qualifications');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteLmsRecord(id: number) {
    try {
        await db.lmsRecord.delete({ where: { id } });
        revalidatePath('/admin/tests-qualifications');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteQualification(id: number) {
    try {
        // Try deleting from test_records or lms_records or qualifications
        const testMatch = await db.testRecord.findUnique({ where: { id } });
        if (testMatch) {
            await db.testRecord.delete({ where: { id } });
        } else {
            const lmsMatch = await db.lmsRecord.findUnique({ where: { id } });
            if (lmsMatch) {
                await db.lmsRecord.delete({ where: { id } });
            } else {
                await db.qualifications.delete({ where: { id } }).catch(() => {});
            }
        }
        revalidatePath('/admin/tests-qualifications');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting qualification:', error);
        return { success: false, error: error.message || 'Failed to delete' };
    }
}

export async function clearTestRecords() {
    try {
        const result = await db.testRecord.deleteMany({});
        revalidatePath('/admin/tests-qualifications');
        return { success: true, count: result.count };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function clearLmsRecords() {
    try {
        const result = await db.lmsRecord.deleteMany({});
        revalidatePath('/admin/tests-qualifications');
        return { success: true, count: result.count };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function clearQualifications() {
    try {
        const [testsRes, lmsRes, qualRes] = await Promise.all([
            db.testRecord.deleteMany({}),
            db.lmsRecord.deleteMany({}),
            db.qualifications.deleteMany({}).catch(() => ({ count: 0 }))
        ]);
        revalidatePath('/admin/tests-qualifications');
        return { success: true, count: testsRes.count + lmsRes.count + qualRes.count };
    } catch (error: any) {
        console.error('Error clearing qualifications:', error);
        return { success: false, error: error.message || 'Failed to clear database' };
    }
}
