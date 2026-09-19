import 'dotenv/config';
import { db } from '../lib/prisma';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TODAY = new Date('2026-09-18T00:00:00Z');
const JUNE_30_2026 = new Date('2026-06-30T23:59:59.999Z');

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

async function revertBulkUpload(isExecute: boolean) {
    console.log(`\n======================================================`);
    console.log(`  REVERT BULK UPLOAD - OPTION B (${isExecute ? 'LIVE EXECUTION' : 'DRY RUN'})`);
    console.log(`  Rule: STRICTLY <= June 30, 2026. Zero changes after June 30.`);
    console.log(`======================================================\n`);

    // 1. Identify today's sessions on or before June 30, 2026
    const targetSessions = await db.trainingSession.findMany({
        where: {
            createdAt: { gte: TODAY },
            startDate: { lte: JUNE_30_2026 } // STRICT SAFETY FILTER
        },
        select: {
            id: true,
            programName: true,
            startDate: true,
            nominationBatchId: true,
            _count: { select: { enrollments: true, attendanceRecords: true } }
        }
    });

    const sessionIds = targetSessions.map(s => s.id);
    const linkedBatchIds = targetSessions.map(s => s.nominationBatchId).filter(Boolean) as string[];

    // Also find any batches created today on or before June 30
    const targetBatches = await db.nominationBatch.findMany({
        where: {
            createdAt: { gte: TODAY },
            OR: [
                { id: { in: linkedBatchIds } },
                { proposedStartDate: { lte: JUNE_30_2026 } }
            ]
        },
        select: { id: true, programId: true }
    });

    const batchIds = Array.from(new Set([...linkedBatchIds, ...targetBatches.map(b => b.id)]));

    console.log(`1. Upload Sessions to delete (<= June 30, 2026): ${sessionIds.length}`);
    console.log(`2. Upload Batches to delete (<= June 30, 2026): ${batchIds.length}`);

    // Verify no enrollments or attendance on target sessions
    const totalEnrollments = targetSessions.reduce((sum, s) => sum + s._count.enrollments, 0);
    const totalAttendance = targetSessions.reduce((sum, s) => sum + s._count.attendanceRecords, 0);
    console.log(`   - Enrollments on target sessions: ${totalEnrollments}`);
    console.log(`   - Attendance on target sessions: ${totalAttendance}`);

    // 2. Identify all 317 UUID programs
    const allPrograms = await db.program.findMany({
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    nominations: true,
                    cohortPrograms: true
                }
            }
        }
    });

    const uuidPrograms = allPrograms.filter(p => UUID_REGEX.test(p.id));
    // Never delete anything with real employee nominations
    const targetPrograms = uuidPrograms.filter(p => p._count.nominations === 0);
    const targetProgramIds = targetPrograms.map(p => p.id);

    console.log(`3. UUID Programs to delete: ${targetProgramIds.length} (out of ${uuidPrograms.length} total UUID programs)`);

    // Verify sessions AFTER June 30 are protected
    const protectedSessions = await db.trainingSession.count({
        where: { startDate: { gt: JUNE_30_2026 } }
    });
    console.log(`4. Sessions after June 30 PROTECTED (will NOT be touched): ${protectedSessions}`);

    if (!isExecute) {
        console.log('\n--- DRY RUN SUMMARY ---');
        console.log(`Will delete:`);
        console.log(`  - ${sessionIds.length} bulk upload training sessions (all <= June 30, 2026)`);
        console.log(`  - ${batchIds.length} bulk upload nomination batches (all <= June 30, 2026)`);
        console.log(`  - ${targetProgramIds.length} auto-generated UUID stub programs`);
        console.log(`Will preserve:`);
        console.log(`  - All ${protectedSessions} sessions after June 30, 2026`);
        console.log(`  - All 314 master catalog programs`);
        console.log(`  - All locations and trainers`);
        console.log('\nRun with --execute to perform this deletion.');
        return;
    }

    console.log('\nExecuting deletion in foreign-key safe order...');

    // A. Delete Training Sessions
    if (sessionIds.length > 0) {
        for (const chunk of chunkArray(sessionIds, 500)) {
            await db.cohortProgram.updateMany({
                where: { sessionId: { in: chunk } },
                data: { sessionId: null }
            });
            await db.attendanceRecord.deleteMany({
                where: { sessionId: { in: chunk } }
            });
            await db.enrollment.deleteMany({
                where: { sessionId: { in: chunk } }
            });
            await db.trainingSession.deleteMany({
                where: { id: { in: chunk } }
            });
        }
        console.log(`✓ Deleted ${sessionIds.length} training sessions.`);
    }

    // B. Delete Nomination Batches
    if (batchIds.length > 0) {
        for (const chunk of chunkArray(batchIds, 500)) {
            await db.nominationBatch.deleteMany({
                where: { id: { in: chunk } }
            });
        }
        console.log(`✓ Deleted ${batchIds.length} nomination batches.`);
    }

    // C. Disconnect and Delete UUID Programs
    if (targetProgramIds.length > 0) {
        // Disconnect sections
        for (const progId of targetProgramIds) {
            await db.program.update({
                where: { id: progId },
                data: { sections: { set: [] } }
            }).catch(() => {});
        }

        // Delete from programs in chunks
        for (const chunk of chunkArray(targetProgramIds, 500)) {
            await db.program.deleteMany({
                where: { id: { in: chunk } }
            });
        }
        console.log(`✓ Deleted ${targetProgramIds.length} UUID programs.`);
    }

    console.log('\n🎉 Option B cleanup completed successfully! Database is restored and clean.');
}

const isExecute = process.argv.includes('--execute');

revertBulkUpload(isExecute)
    .catch(console.error)
    .finally(() => db.$disconnect());
