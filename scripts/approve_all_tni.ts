import 'dotenv/config';
import { db } from '../lib/prisma';

async function main() {
    console.log("Starting revert update...");

    // Update all nominations where managerApprovalStatus is 'BULK_UPLOADED' to be fully 'Approved'
    const result = await db.nomination.updateMany({
        where: {
            managerApprovalStatus: 'BULK_UPLOADED'
        },
        data: {
            managerApprovalStatus: 'Approved',
            status: 'Approved'
        }
    });

    console.log(`Successfully approved both statuses for ${result.count} BULK_UPLOADED nominations.`);
}

main()
    .catch((e) => {
        console.error("Error running script:", e);
        process.exit(1);
    })
    .finally(async () => {
        console.log("Finished.");
    });
