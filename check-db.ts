import { db } from './lib/prisma';

async function run() {
    const nominations = await db.nomination.findMany({
        select: {
            id: true,
            status: true,
            managerApprovalStatus: true,
            employee: { select: { name: true, managerEmail: true } }
        }
    });
    console.log('Nominations:', JSON.stringify(nominations, null, 2));
}

run();
