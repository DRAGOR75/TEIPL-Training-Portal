import 'dotenv/config';
import { db } from '../lib/prisma';

async function main() {
    console.log("Starting migration of SystemTrainingHistory locations to programRegion...");

    const histories = await db.systemTrainingHistory.findMany({
        where: { location: { not: null } }
    });

    console.log(`Found ${histories.length} history records with an existing location.`);

    let updatedCount = 0;
    for (const history of histories) {
        if (history.location) {
            await db.systemTrainingHistory.update({
                where: { id: history.id },
                data: { programRegion: history.location } 
            });
            updatedCount++;
        }
    }

    console.log(`Successfully copied location to programRegion for ${updatedCount} records.`);
}

main()
    .catch((e) => {
        console.error("Error running script:", e);
        process.exit(1);
    })
    .finally(async () => {
        process.exit(0);
    });
