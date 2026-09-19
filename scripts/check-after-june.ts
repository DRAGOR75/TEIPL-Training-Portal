import 'dotenv/config';
import { db } from '../lib/prisma';

const JUNE_30_2026 = new Date('2026-06-30T23:59:59.999Z');
const TODAY_START = new Date('2026-09-18T00:00:00Z');

async function checkAfterJune() {
    console.log(`\n======================================================`);
    console.log(`  AUDIT: SESSIONS & BATCHES AFTER JUNE 30, 2026`);
    console.log(`======================================================\n`);

    // 1. Fetch all sessions with startDate > June 30, 2026
    const sessionsAfterJune = await db.trainingSession.findMany({
        where: {
            startDate: { gt: JUNE_30_2026 }
        },
        select: {
            id: true,
            programName: true,
            startDate: true,
            endDate: true,
            location: true,
            trainerName: true,
            createdAt: true,
            nominationBatch: {
                select: {
                    id: true,
                    programId: true,
                    createdAt: true,
                    program: {
                        select: {
                            id: true,
                            name: true,
                            sectionCodeName: true
                        }
                    },
                    _count: {
                        select: { nominations: true }
                    }
                }
            },
            _count: {
                select: {
                    enrollments: true,
                    attendanceRecords: true
                }
            }
        },
        orderBy: { startDate: 'asc' }
    });

    console.log(`Total sessions after June 30, 2026: ${sessionsAfterJune.length}`);

    // Break down by when they were created (createdAt)
    const createdToday = sessionsAfterJune.filter(s => s.createdAt >= TODAY_START);
    const createdBeforeToday = sessionsAfterJune.filter(s => s.createdAt < TODAY_START);

    console.log(`\n--- CREATION DATE BREAKDOWN ---`);
    console.log(`Sessions after June 30 created TODAY (2026-09-18): ${createdToday.length}`);
    console.log(`Sessions after June 30 created BEFORE today: ${createdBeforeToday.length}`);

    // Check programs of these sessions
    const programsUsed = new Map<string, { id: string, name: string, isUuid: boolean, count: number }>();
    for (const s of sessionsAfterJune) {
        const prog = s.nominationBatch?.program;
        if (prog) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prog.id);
            const existing = programsUsed.get(prog.id) || { id: prog.id, name: prog.name, isUuid, count: 0 };
            existing.count++;
            programsUsed.set(prog.id, existing);
        }
    }

    console.log(`\n--- DISTINCT PROGRAMS USED BY SESSIONS AFTER JUNE 30 ---`);
    console.log(`Total distinct programs: ${programsUsed.size}`);
    const programList = Array.from(programsUsed.values());
    const uuidProgs = programList.filter(p => p.isUuid);
    const masterProgs = programList.filter(p => !p.isUuid);

    console.log(`  - Master programs: ${masterProgs.length}`);
    console.log(`  - UUID programs: ${uuidProgs.length}`);

    if (uuidProgs.length > 0) {
        console.log(`UUID programs found after June:`, uuidProgs);
    }

    // Check enrollments & attendance on sessions created today after June 30
    const enrollmentsToday = createdToday.reduce((sum, s) => sum + s._count.enrollments, 0);
    const attendanceToday = createdToday.reduce((sum, s) => sum + s._count.attendanceRecords, 0);
    const nomsToday = createdToday.reduce((sum, s) => sum + (s.nominationBatch?._count.nominations || 0), 0);

    console.log(`\n--- PARTICIPATION STATS FOR SESSIONS CREATED TODAY AFTER JUNE 30 ---`);
    console.log(`Enrollments: ${enrollmentsToday}`);
    console.log(`Attendance Records: ${attendanceToday}`);
    console.log(`Nominations: ${nomsToday}`);

    // Show date ranges and sample sessions
    console.log(`\n--- DATE RANGE OF SESSIONS AFTER JUNE 30 ---`);
    if (sessionsAfterJune.length > 0) {
        console.log(`Earliest start date: ${sessionsAfterJune[0].startDate.toISOString().split('T')[0]}`);
        console.log(`Latest start date: ${sessionsAfterJune[sessionsAfterJune.length - 1].startDate.toISOString().split('T')[0]}`);
    }

    console.log(`\n--- SAMPLE SESSIONS CREATED TODAY (first 10) ---`);
    createdToday.slice(0, 10).forEach((s, idx) => {
        console.log(` ${idx + 1}. [${s.startDate.toISOString().split('T')[0]}] Program: "${s.programName}" (ProgID: ${s.nominationBatch?.programId}) | Created: ${s.createdAt.toISOString()}`);
    });

    console.log(`\n--- SAMPLE SESSIONS CREATED BEFORE TODAY (first 5) ---`);
    createdBeforeToday.slice(0, 5).forEach((s, idx) => {
        console.log(` ${idx + 1}. [${s.startDate.toISOString().split('T')[0]}] Program: "${s.programName}" | Created: ${s.createdAt.toISOString()}`);
    });
}

checkAfterJune()
    .catch(console.error)
    .finally(() => db.$disconnect());
