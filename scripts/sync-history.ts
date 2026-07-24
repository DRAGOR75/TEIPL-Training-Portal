import { db } from '../lib/prisma';
import 'dotenv/config';

async function main() {
    console.log("Starting sync script...");

    // Find all nominations with status Completed or Absent
    const nominations = await db.nomination.findMany({
        where: {
            status: {
                in: ['Completed', 'Absent']
            }
        },
        include: {
            employee: true,
            program: true,
            batch: {
                include: {
                    trainingSession: true
                }
            }
        }
    });

    console.log(`Found ${nominations.length} finalized nominations.`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const nom of nominations) {
        try {
            const emp = nom.employee;
            const session = nom.batch?.trainingSession;

            if (!session) {
                console.warn(`[WARNING] Nomination ${nom.id} has no training session attached. Skipping.`);
                continue;
            }

            const sessionId = session.id;
            const empId = emp.id;
            const finalStatus = nom.status;

            // Compute attendance percentage
            const classDatesCount = session.classDates?.length || 1;
            const presentRecords = await db.attendanceRecord.count({
                where: {
                    sessionId,
                    empId,
                    status: 'Present'
                }
            });
            const attendancePercentage = classDatesCount > 0 
                ? (presentRecords / classDatesCount) * 100 
                : 0;

            const existingHistory = await db.systemTrainingHistory.findFirst({
                where: { empId, sessionId }
            });

            const start = new Date(session.startDate);
            const end = new Date(session.endDate);
            const trainingDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

            const monthStr = start.toLocaleString('en-US', { month: 'short' });
            const yearStr = start.getFullYear().toString();

            const progCategory = nom.program.category;

            if (!existingHistory) {
                await db.systemTrainingHistory.create({
                    data: {
                        empId: empId,
                        employeeName: emp.name,
                        programName: session.programName,
                        startDate: session.startDate,
                        endDate: session.endDate,
                        trainingDays: trainingDays > 0 ? trainingDays : null,
                        employeeRegion: emp.region,
                        progCategory: session.sessionCategory || progCategory,

                        organization: emp.organization,
                        onRollContract: emp.onRollContract,
                        department: emp.department,
                        employeeGroup: emp.departmentGroup,
                        employeeGrouupMNmw: emp.employeeGrouupMNmw,
                        aadharNumber: emp.aadharNumber,
                        designation: emp.designation,
                        section: emp.sectionName,
                        month: monthStr,
                        year: yearStr,
                        gender: emp.gender,
                        location: session.location || emp.location,
                        sessionId: sessionId,
                        trainerName: session.trainerName,
                        attendancePercentage: attendancePercentage,
                        status: finalStatus,
                        sessionCategory: session.sessionCategory,
                        altProgramName: session.altProgramName,
                        subjectCode: nom.program.id
                    }
                });
                created++;
            } else {
                await db.systemTrainingHistory.update({
                    where: { id: existingHistory.id },
                    data: { 
                        attendancePercentage: attendancePercentage,
                        status: finalStatus,
                        programName: session.programName,
                        sessionCategory: session.sessionCategory,
                        progCategory: session.sessionCategory,
                        altProgramName: session.altProgramName,
                        subjectCode: nom.program.id
                    }
                });
                updated++;
            }
        } catch (err) {
            console.error(`[ERROR] Failed to sync nomination ${nom.id}:`, err);
            errors++;
        }
    }

    console.log(`Sync complete! Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
