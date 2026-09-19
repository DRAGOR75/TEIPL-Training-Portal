import 'dotenv/config';
import { db } from '../lib/prisma';

async function main() {
    console.log('Starting cohort update for Cohort 36...');

    // 1. Get all cohort programs for Cohort 36
    const cohortPrograms = await db.cohortProgram.findMany({
        where: { cohortId: '36' },
        select: { id: true, sessionId: true, programId: true }
    });
    console.log(`Found ${cohortPrograms.length} programs in Cohort 36.`);

    // 2. Mark all programs as Completed
    const cpRes = await db.cohortProgram.updateMany({
        where: { cohortId: '36' },
        data: { status: 'Completed' }
    });
    console.log(`Updated ${cpRes.count} CohortProgram records to Completed.`);

    // 3. Mark linked training sessions as Completed
    const sessionIds = cohortPrograms.map(cp => cp.sessionId).filter(Boolean) as string[];
    if (sessionIds.length > 0) {
        const sessRes = await db.trainingSession.updateMany({
            where: { id: { in: sessionIds } },
            data: { status: 'Completed' }
        });
        console.log(`Updated ${sessRes.count} linked TrainingSession records to Completed.`);
    }

    // 4. Mark Cohort 36 as Completed
    const cohortRes = await db.cohort.update({
        where: { id: '36' },
        data: { status: 'Completed' }
    });
    console.log(`Cohort 36 (${cohortRes.name}) status updated to: ${cohortRes.status}`);

    // 5. Mark cohort members as Completed
    const memberRes = await db.cohortMember.updateMany({
        where: { cohortId: '36', status: 'Active' },
        data: { status: 'Completed', completedAt: new Date() }
    });
    console.log(`Updated ${memberRes.count} cohort members to Completed.`);

    console.log('SUCCESS: All programs in this cohort are marked completed!');
}

main()
    .catch((err) => {
        console.error('Error updating cohort:', err);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
