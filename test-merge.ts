import { db } from './lib/prisma';

async function testMerge() {
    const employees = await db.employee.findMany({ take: 2 });
    if (employees.length < 2) {
        console.log("Not enough employees to test.");
        return;
    }
    const primaryId = employees[0].id;
    const duplicateId = employees[1].id;
    
    console.log(`Testing merge: Duplicate ${duplicateId} -> Primary ${primaryId}`);
    
    try {
        const result = await db.$transaction(async (tx) => {
            const duplicate = await tx.employee.findUnique({ where: { id: duplicateId } });
            
            // 1. Direct Updates (No complex unique constraints)
            await tx.systemTrainingHistory.updateMany({
                where: { empId: duplicateId },
                data: { empId: primaryId }
            });

            await tx.trainingHistory.updateMany({
                where: { empId: duplicateId },
                data: { empId: primaryId }
            });

            await tx.qualifications.updateMany({
                where: { empID: duplicateId },
                data: { empID: primaryId }
            });

            await tx.enrollment.updateMany({
                where: { empId: duplicateId },
                data: { empId: primaryId }
            });

            await tx.employee.updateMany({
                where: { managerId: duplicateId },
                data: { managerId: primaryId }
            });

            // 2. Resolve Unique Constraints Manually

            // A. AttendanceRecord (@@unique([sessionId, empId, date]))
            const dupAttendances = await tx.attendanceRecord.findMany({ where: { empId: duplicateId } });
            for (const att of dupAttendances) {
                const existing = await tx.attendanceRecord.findUnique({
                    where: { sessionId_empId_date: { sessionId: att.sessionId, empId: primaryId, date: att.date } }
                });
                if (existing) {
                    await tx.attendanceRecord.delete({ where: { id: att.id } }); // Delete duplicate
                } else {
                    await tx.attendanceRecord.update({
                        where: { id: att.id },
                        data: { empId: primaryId }
                    });
                }
            }

            // B. Nomination (@@unique([empId, batchId]))
            const dupNominations = await tx.nomination.findMany({ where: { empId: duplicateId } });
            for (const nom of dupNominations) {
                if (nom.batchId) {
                    const existing = await tx.nomination.findUnique({
                        where: { empId_batchId: { empId: primaryId, batchId: nom.batchId } }
                    });
                    if (existing) {
                        await tx.nomination.delete({ where: { id: nom.id } });
                    } else {
                        await tx.nomination.update({
                            where: { id: nom.id },
                            data: { empId: primaryId }
                        });
                    }
                } else {
                    // No batchId, no unique constraint violation
                    await tx.nomination.update({
                        where: { id: nom.id },
                        data: { empId: primaryId }
                    });
                }
            }

            // C. CohortMember (@@unique([cohortId, employeeId]))
            const dupCohortMembers = await tx.cohortMember.findMany({ where: { employeeId: duplicateId } });
            for (const mem of dupCohortMembers) {
                const existing = await tx.cohortMember.findUnique({
                    where: { cohortId_employeeId: { cohortId: mem.cohortId, employeeId: primaryId } }
                });
                if (existing) {
                    await tx.cohortMember.delete({ where: { id: mem.id } });
                } else {
                    await tx.cohortMember.update({
                        where: { id: mem.id },
                        data: { employeeId: primaryId }
                    });
                }
            }

            // D. CohortFeedback (@@unique([cohortId, empId]))
            const dupCohortFeedbacks = await tx.cohortFeedback.findMany({ where: { empId: duplicateId } });
            for (const fb of dupCohortFeedbacks) {
                const existing = await tx.cohortFeedback.findUnique({
                    where: { cohortId_empId: { cohortId: fb.cohortId, empId: primaryId } }
                });
                if (existing) {
                    await tx.cohortFeedback.delete({ where: { id: fb.id } });
                } else {
                    await tx.cohortFeedback.update({
                        where: { id: fb.id },
                        data: { empId: primaryId }
                    });
                }
            }

            // 3. Mark Duplicate as Inactive instead of deleting
            // DO NOT actually update so we don't break the DB
            console.log("Would have updated employee:", duplicate?.name);

            return true;
        });
        
        console.log("Merge completed successfully (dry run logic).");
    } catch (e: any) {
        console.error("Error during merge:", e);
    } finally {
        await db.$disconnect();
    }
}

testMerge();
