import 'dotenv/config';
import { db } from '../lib/prisma';

async function main() {
    const total = await db.nomination.count();
    console.log(`Total nominations: ${total}`);

    const statuses = await db.nomination.groupBy({
        by: ['status'],
        _count: {
            id: true,
        },
    });
    console.log('Nomination general statuses:', statuses);

    const approvalStatuses = await db.nomination.groupBy({
        by: ['managerApprovalStatus'],
        _count: {
            id: true,
        },
    });
    console.log('Manager Approval statuses:', approvalStatuses);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        // Since db uses a global pg pool, we can't easily disconnect it, but node will exit.
    });
