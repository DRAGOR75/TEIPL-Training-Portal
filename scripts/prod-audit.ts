import 'dotenv/config';
import { db } from '../lib/prisma';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JUNE_30_2026 = new Date('2026-06-30T23:59:59.999Z');

async function analyzeProduction() {
    console.log(`\n======================================================`);
    console.log(`  PRODUCTION DATABASE AUDIT & ANALYSIS (READ-ONLY)`);
    console.log(`======================================================\n`);

    // 1. PROGRAMS
    const allPrograms = await db.program.findMany({
        select: {
            id: true,
            name: true,
            sectionCodeName: true,
            _count: {
                select: {
                    nominations: true,
                    cohortPrograms: true,
                    batches: true
                }
            }
        }
    });

    const masterPrograms = allPrograms.filter(p => !UUID_REGEX.test(p.id));
    const uuidPrograms = allPrograms.filter(p => UUID_REGEX.test(p.id));
    const uuidWithNoms = uuidPrograms.filter(p => p._count.nominations > 0);
    const uuidWithCohorts = uuidPrograms.filter(p => p._count.cohortPrograms > 0);
    const uuidWithBatches = uuidPrograms.filter(p => p._count.batches > 0);
    const uuidPureStubs = uuidPrograms.filter(p => p._count.nominations === 0 && p._count.cohortPrograms === 0 && p._count.batches === 0);

    console.log(`--- 1. PROGRAMS ---`);
    console.log(`Total Programs: ${allPrograms.length}`);
    console.log(`Master Programs (Alphanumeric IDs): ${masterPrograms.length}`);
    console.log(`UUID Programs: ${uuidPrograms.length}`);
    console.log(`  - UUID with nominations: ${uuidWithNoms.length}`);
    console.log(`  - UUID with cohort links: ${uuidWithCohorts.length}`);
    console.log(`  - UUID with batches: ${uuidWithBatches.length}`);
    console.log(`  - UUID pure orphan stubs (0 noms, 0 cohorts, 0 batches): ${uuidPureStubs.length}`);

    // 2. TRAINING SESSIONS & BATCHES (DATE BREAKDOWN)
    const allSessions = await db.trainingSession.findMany({
        select: {
            id: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            programName: true,
            nominationBatch: {
                select: {
                    id: true,
                    programId: true
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

    const sessionsBeforeOrOnJune30 = allSessions.filter(s => new Date(s.startDate) <= JUNE_30_2026);
    const sessionsAfterJune30 = allSessions.filter(s => new Date(s.startDate) > JUNE_30_2026);

    // Filter sessions linked to UUID programs vs master programs
    const sessionsWithUuidProgBeforeJune = sessionsBeforeOrOnJune30.filter(s => s.nominationBatch?.programId && UUID_REGEX.test(s.nominationBatch.programId));
    const sessionsWithUuidProgAfterJune = sessionsAfterJune30.filter(s => s.nominationBatch?.programId && UUID_REGEX.test(s.nominationBatch.programId));

    console.log(`\n--- 2. TRAINING SESSIONS ---`);
    console.log(`Total Sessions: ${allSessions.length}`);
    console.log(`Sessions on or BEFORE June 30, 2026: ${sessionsBeforeOrOnJune30.length}`);
    console.log(`  - Pointing to UUID programs: ${sessionsWithUuidProgBeforeJune.length}`);
    console.log(`  - Pointing to Master programs: ${sessionsBeforeOrOnJune30.length - sessionsWithUuidProgBeforeJune.length}`);
    console.log(`Sessions AFTER June 30, 2026 (PROTECTED): ${sessionsAfterJune30.length}`);
    console.log(`  - Pointing to UUID programs: ${sessionsWithUuidProgAfterJune.length}`);
    console.log(`  - Pointing to Master programs: ${sessionsAfterJune30.length - sessionsWithUuidProgAfterJune.length}`);

    const allBatches = await db.nominationBatch.findMany({
        select: {
            id: true,
            programId: true,
            proposedStartDate: true,
            createdAt: true
        }
    });
    console.log(`\n--- 3. NOMINATION BATCHES ---`);
    console.log(`Total Batches: ${allBatches.length}`);

    // 4. LOCATIONS
    const allLocations = await db.location.findMany({
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
    });
    console.log(`\n--- 4. LOCATIONS ---`);
    console.log(`Total Locations: ${allLocations.length}`);
    console.log(`Names:`, allLocations.map(l => l.name));

    // 5. TRAINERS
    const allTrainers = await db.trainer.findMany({
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
    });
    console.log(`\n--- 5. TRAINERS ---`);
    console.log(`Total Trainers: ${allTrainers.length}`);
    if (allTrainers.length <= 15) {
        console.log(`Names:`, allTrainers.map(t => t.name));
    } else {
        console.log(`First 15 names:`, allTrainers.slice(0, 15).map(t => t.name));
        console.log(`... and ${allTrainers.length - 15} more.`);
    }

    // 6. SAMPLE OF UUID PROGRAMS
    console.log(`\n--- 6. SAMPLE UUID PROGRAMS (first 10) ---`);
    uuidPrograms.slice(0, 10).forEach((p, idx) => {
        console.log(`  ${idx + 1}. [${p.id}] "${p.name}" (cohorts: ${p._count.cohortPrograms}, batches: ${p._count.batches}, noms: ${p._count.nominations})`);
    });
}

analyzeProduction()
    .catch(console.error)
    .finally(() => db.$disconnect());
