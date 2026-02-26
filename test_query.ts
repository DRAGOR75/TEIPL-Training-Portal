import { db } from './lib/prisma';

async function main() {
    console.log("Searching for batches containing 'AC Electrical'...");

    // Find batches that might match
    const batches = await db.nominationBatch.findMany({
        where: {
            name: {
                contains: 'AC Electrical',
                mode: 'insensitive'
            }
        },
        include: {
            nominations: true
        }
    });

    console.log(`Found ${batches.length} matching batches.`);

    batches.forEach(b => {
        console.log(`\nBatch ID: ${b.id}`);
        console.log(`Batch Name: "${b.name}"`);
        console.log(`Status: ${b.status}`);
        console.log(`Total Nominations: ${b.nominations.length}`);

        const batchedCount = b.nominations.filter(n => n.status === 'Batched').length;
        console.log(`Nominations with status 'Batched': ${batchedCount}`);
    });
}

main()
    .catch(e => console.error(e));
