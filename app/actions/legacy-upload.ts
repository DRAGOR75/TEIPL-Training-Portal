'use server';

import { db } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface LegacyRecord {
    empId: string;
    employeeName: string;
    employmentStatus?: string;
    programName: string;
    region?: string;
    startDate?: string;
    endDate?: string;
    trainingDays?: number | null;
    trainingHours?: number | null;
    progCategory?: string;
    location?: string;
    mobile?: string;
    email?: string;
    subjectCode?: string;
    altProgramName?: string;

    organization?: string;
    onRollContract?: string;
    department?: string;
    departmentGroup?: string;
    employeeGroup?: string;
    employeeGrouupMNmw?: string;
    aadharNumber?: string;
    designation?: string;
    section?: string;
    month?: string;
    year?: string;
    gender?: string;
    attendancePercentage?: number | null;
    sessionId?: string;
    employeeLocation?: string;
    programRegion?: string;
    programAddress?: string;
}

function parseDate(dateStr?: string): Date | null {
    if (!dateStr || dateStr.trim() === '') return null;
    // Handle 'DD-MMM-YY' or 'DD-MMM-YYYY'
    try {
        const parts = dateStr.trim().split('-');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const monthStr = parts[1];
            let year = parseInt(parts[2], 10);
            
            // Adjust 2-digit year
            if (year < 100) {
                year += 2000;
            }

            const monthMap: Record<string, number> = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            const month = monthMap[monthStr] !== undefined ? monthMap[monthStr] : new Date(Date.parse(monthStr +" 1, 2012")).getMonth();
            
            if (!isNaN(day) && !isNaN(year) && !isNaN(month)) {
                return new Date(Date.UTC(year, month, day));
            }
        }
        
        // Fallback to generic Date parsing
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) return parsed;
        
        return null;
    } catch (e) {
        return null;
    }
}

export async function processLegacyTrainingBatch(records: LegacyRecord[]) {
    try {
        if (!records || records.length === 0) {
            return { success: true, count: 0 };
        }

        const validRecords = records.filter(r => r.empId && (r.subjectCode || r.altProgramName || r.programName));

        if (validRecords.length === 0) {
            return { success: false, error: 'No valid records found in batch.' };
        }

        // 1. Collect all unique employees from the batch
        const employeeMap = new Map<string, any>();
        for (const record of validRecords) {
            const status = record.employmentStatus || 'Active';
            const isInactive = status.toLowerCase() !== 'active';
            
            // If inactive, immediately use the fallback email to prevent taking up a real email address
            const recordEmail = isInactive 
                ? `${record.empId}@thriveni.com` 
                : (record.email || `${record.empId}@thriveni.com`);

            if (!employeeMap.has(record.empId)) {
                employeeMap.set(record.empId, {
                    empId: record.empId,
                    name: record.employeeName || 'Unknown',
                    email: recordEmail,
                    mobile: record.mobile || null,
                    status: status,
                });
            } else {
                const existing = employeeMap.get(record.empId);
                
                // If we see them again and one record says Active, upgrade status to Active
                if (existing.status.toLowerCase() !== 'active' && status.toLowerCase() === 'active') {
                    existing.status = 'Active';
                    // Also upgrade email to real one if we have it
                    if (record.email && !record.email.startsWith(record.empId)) {
                        existing.email = record.email;
                    }
                }
                
                if (!existing.mobile && record.mobile) {
                    existing.mobile = record.mobile;
                }
            }
        }

        // 2. Fetch existing employees to see who we need to create vs update
        const empIds = Array.from(employeeMap.keys());
        const existingEmployees = await db.employee.findMany({
            where: { id: { in: empIds } },
            select: { id: true, email: true, mobile: true, name: true, status: true }
        });

        const existingEmpMap = new Map(existingEmployees.map(e => [e.id, e]));

        // 2b. Fetch existing emails to prevent unique constraint collisions (ON CONFLICT skip issues)
        const emailsInBatch = Array.from(employeeMap.values())
            .map(e => e.email)
            .filter(Boolean) as string[];

        const conflictingEmployees = await db.employee.findMany({
            where: { email: { in: emailsInBatch } },
            select: { id: true, email: true }
        });
        const conflictingEmailMap = new Map(conflictingEmployees.map(e => [e.email, e.id]));

        // Track emails we are assigning to new employees in this batch to avoid in-batch collisions
        const assignedEmails = new Set<string>();
        // Add existing emails of employees we are not creating but might be updating/keeping
        for (const emp of existingEmployees) {
            if (emp.email) assignedEmails.add(emp.email);
        }

        // 3. Prepare Employee updates/creates
        const employeesToCreate: any[] = [];
        const employeesToUpdate: any[] = [];

        for (const [id, data] of employeeMap.entries()) {
            const existing = existingEmpMap.get(id);
            const isInactive = data.status.toLowerCase() !== 'active';

            if (existing) {
                // Update if they are missing email/mobile and we have it
                let needsUpdate = false;
                const updateData: any = {};
                
                if (!existing.mobile && data.mobile) {
                    updateData.mobile = data.mobile;
                    needsUpdate = true;
                }

                // If status in CSV differs from DB, update it
                if (existing.status !== data.status) {
                    updateData.status = data.status;
                    needsUpdate = true;
                }
                
                // If the employee in the database is currently using a fallback email and we have a new email
                if (existing.email.startsWith(id + '@thriveni.com') && data.email && !data.email.startsWith(id)) {
                    if (isInactive) {
                        // Keep fallback for inactive employees
                        needsUpdate = false;
                    } else {
                        // For active employees, try to use the real email if it's not already taken
                        const conflictId = conflictingEmailMap.get(data.email);
                        const isTaken = (conflictId && conflictId !== id) || assignedEmails.has(data.email);
                        
                        if (!isTaken) {
                            updateData.email = data.email;
                            needsUpdate = true;
                            assignedEmails.add(data.email);
                        }
                    }
                }

                if (needsUpdate) {
                    employeesToUpdate.push({
                        id,
                        data: updateData
                    });
                }
            } else {
                // Determine a safe, unique email for the new employee
                let finalEmail = data.email;
                
                if (isInactive) {
                    // Force fallback for inactive employees to save real email addresses for active staff
                    finalEmail = `${data.empId}@thriveni.com`;
                } else {
                    const conflictId = conflictingEmailMap.get(finalEmail);
                    const isTaken = (conflictId && conflictId !== data.empId) || assignedEmails.has(finalEmail);

                    if (isTaken) {
                        // Fallback if the active employee's email is already occupied
                        finalEmail = `${data.empId}@thriveni.com`;
                    }
                }

                employeesToCreate.push({
                    id: data.empId,
                    name: data.name,
                    email: finalEmail,
                    mobile: data.mobile,
                    status: data.status
                });
                assignedEmails.add(finalEmail);
            }
        }

        // 3b. Fetch programs for subjectCode mapping
        const subjectCodes = Array.from(new Set(validRecords.map(r => r.subjectCode).filter(Boolean))) as string[];
        const programs = await db.program.findMany({
            where: { id: { in: subjectCodes } },
            select: { id: true, name: true }
        });
        const programMap = new Map(programs.map(p => [p.id, p.name]));

        // 4. Prepare TrainingHistory inserts
        const historyInserts = validRecords.map(record => {
            const start = parseDate(record.startDate) || new Date();
            const end = parseDate(record.endDate) || start;
            
            let finalProgramName = record.programName || 'Unknown Program';
            if (record.subjectCode && programMap.has(record.subjectCode)) {
                finalProgramName = programMap.get(record.subjectCode)!;
            } else if (record.altProgramName) {
                finalProgramName = record.altProgramName;
            }

            return {
                empId: record.empId,
                employeeName: record.employeeName || 'Unknown',
                programName: finalProgramName,
                startDate: start,
                endDate: end,
                trainingDays: record.trainingDays ? parseInt(record.trainingDays as any, 10) : null,
                trainingHours: record.trainingHours ? parseFloat(record.trainingHours as any) : null,
                region: record.region || null,
                location: record.location || null,
                progCategory: record.progCategory || null,
                organization: record.organization || null,
                onRollContract: record.onRollContract || null,
                department: record.department || null,
                departmentGroup: record.departmentGroup || null,
                employeeGroup: record.employeeGroup || null,
                employeeGrouupMNmw: record.employeeGrouupMNmw || null,
                aadharNumber: record.aadharNumber || null,
                designation: record.designation || null,
                section: record.section || null,
                month: record.month || null,
                year: record.year || null,
                gender: record.gender || null,
                attendancePercentage: record.attendancePercentage || null,
                sessionId: record.sessionId || null,
                source: 'LEGACY',
                employeeLocation: record.employeeLocation || null,
                programRegion: record.programRegion || null,
                programAddress: record.programAddress || null,
                subjectCode: record.subjectCode || null,
                altProgramName: record.altProgramName || null
            };
        });

        // 5. Execute all database operations
        await db.$transaction(async (tx) => {
            // A. Create missing employees
            if (employeesToCreate.length > 0) {
                await tx.employee.createMany({
                    data: employeesToCreate,
                    skipDuplicates: true
                });
            }

            // B. Update existing employees in parallel inside the transaction
            if (employeesToUpdate.length > 0) {
                await Promise.all(
                    employeesToUpdate.map(item => 
                        tx.employee.update({
                            where: { id: item.id },
                            data: item.data
                        })
                    )
                );
            }

            // C. Insert training history
            if (historyInserts.length > 0) {
                await tx.trainingHistory.createMany({
                    data: historyInserts
                });
            }
        }, {
            maxWait: 30000, // Wait up to 30 seconds to acquire connection
            timeout: 120000 // Allow transaction to run for up to 2 minutes
        });

        return { success: true, count: validRecords.length };
        
    } catch (error: any) {
        console.error('Batch Upload Error:', error);
        return { success: false, error: error.message || 'Failed to process batch' };
    }
}

export async function clearTrainingHistory() {
    try {
        // Delete all rows in the training_history table to allow a completely clean retry
        const result = await db.trainingHistory.deleteMany({});
        return { success: true, count: result.count };
    } catch (error: any) {
        console.error('Failed to clear training history:', error);
        return { success: false, error: error.message || 'Failed to clear database table' };
    }
}
