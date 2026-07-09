import 'dotenv/config';
import { db } from '../lib/prisma';

async function main() {
    console.log("Starting migration of TrainingSession locations to regions...");

    const sessions = await db.trainingSession.findMany({
        where: { location: { not: null } }
    });

    console.log(`Found ${sessions.length} sessions with an existing location.`);

    let updatedCount = 0;
    for (const session of sessions) {
        if (session.location) {
            await db.trainingSession.update({
                where: { id: session.id },
                data: { region: session.location }
            });
            updatedCount++;
        }
    }

    console.log(`Successfully copied location to region for ${updatedCount} sessions.`);
}

main()
    .catch((e) => {
        console.error("Error running script:", e);
        process.exit(1);
    })
    .finally(async () => {
        process.exit(0);
    });
