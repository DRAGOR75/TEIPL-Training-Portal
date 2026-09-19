import 'dotenv/config';
import { db } from '../lib/prisma';

// Regex to identify standard UUID format: 8-4-4-4-12 hex characters
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function cleanUuidPrograms(includeCohorts: boolean = false, isDryRun: boolean = true) {
    console.log(`\n=== CLEANUP UUID PROGRAMS (${isDryRun ? 'DRY RUN - No changes will be made' : 'LIVE EXECUTION'}) ===`);
    console.log(`Include programs linked to cohorts: ${includeCohorts ? 'YES' : 'NO (Only unlinked stub programs)'}\n`);

    // 1. Fetch all programs
    const allPrograms = await db.program.findMany({
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    nominations: true,
                    cohortPrograms: true,
                    batches: true
                }
            }
        }
    });

    // 2. Filter UUID programs
    const uuidPrograms = allPrograms.filter(p => UUID_REGEX.test(p.id));
    console.log(`Found ${uuidPrograms.length} total programs with UUID format IDs.`);

    const targetPrograms = uuidPrograms.filter(p => {
        if (p._count.nominations > 0) return false; // Never delete anything with real nominations
        if (!includeCohorts && p._count.cohortPrograms > 0) return false;
        return true;
    });

    console.log(`Identified ${targetPrograms.length} target programs to delete.`);
    const targetProgramIds = targetPrograms.map(p => p.id);

    // 3. Find referencing batches and sessions
    const referencingBatches = await db.nominationBatch.findMany({
        where: { programId: { in: targetProgramIds } },
        select: { id: true, trainingSession: { select: { id: true } } }
    });

    const batchIds = referencingBatches.map(b => b.id);
    const sessionIds = referencingBatches
        .map(b => b.trainingSession?.id)
        .filter(Boolean) as string[];

    console.log(`- Linked Batches to delete: ${batchIds.length}`);
    console.log(`- Linked Training Sessions to delete: ${sessionIds.length}`);

    let cohortProgramIds: string[] = [];
    if (includeCohorts) {
        const linkedCohorts = await db.cohortProgram.findMany({
            where: { programId: { in: targetProgramIds } },
            select: { id: true }
        });
        cohortProgramIds = linkedCohorts.map(c => c.id);
        console.log(`- Linked Cohort Program mappings to delete: ${cohortProgramIds.length}`);
    }

    if (isDryRun) {
        console.log('\n[DRY RUN SUMMARY] Sample programs that will be removed:');
        targetPrograms.slice(0, 15).forEach((p, idx) => {
            console.log(` ${idx + 1}. [${p.id}] ${p.name}`);
        });
        if (targetPrograms.length > 15) {
            console.log(` ... and ${targetPrograms.length - 15} more.`);
        }
        console.log('\nTo execute for real, run with: --execute');
        return;
    }

    // 4. Execution in correct foreign-key order
    console.log('\nExecuting deletion in foreign-key safe order...');

    // A. Delete training sessions
    if (sessionIds.length > 0) {
        const delSessions = await db.trainingSession.deleteMany({
            where: { id: { in: sessionIds } }
        });
        console.log(`✓ Deleted ${delSessions.count} training sessions.`);
    }

    // B. Delete nomination batches
    if (batchIds.length > 0) {
        const delBatches = await db.nominationBatch.deleteMany({
            where: { id: { in: batchIds } }
        });
        console.log(`✓ Deleted ${delBatches.count} nomination batches.`);
    }

    // C. Delete cohort programs (if requested)
    if (cohortProgramIds.length > 0) {
        const delCP = await db.cohortProgram.deleteMany({
            where: { id: { in: cohortProgramIds } }
        });
        console.log(`✓ Deleted ${delCP.count} cohort program links.`);
    }

    // D. Delete the target programs
    const delPrograms = await db.program.deleteMany({
        where: { id: { in: targetProgramIds } }
    });
    console.log(`✓ Successfully deleted ${delPrograms.count} UUID programs!`);

    console.log('\nCleanup completed successfully.');
}

const isExecute = process.argv.includes('--execute');
const includeCohorts = process.argv.includes('--all');

cleanUuidPrograms(includeCohorts, !isExecute)
    .catch(console.error)
    .finally(() => db.$disconnect());
