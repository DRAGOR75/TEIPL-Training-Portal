import { db } from './lib/prisma';

async function main() {
    const trainers = await db.trainer.findMany();
    console.log(`--- TRAINERS (${trainers.length}) ---`);
    for (const t of trainers) {
        console.log(`ID: ${t.id} | Name: "${t.name}"`);
    }

    const sessions = await db.trainingSession.findMany();
    console.log(`\n--- SESSIONS (${sessions.length}) ---`);
    for (const s of sessions) {
        console.log(`ID: ${s.id} | Trainer: "${s.trainerName}" | Start: ${s.startDate} | End: ${s.endDate}`);
    }
}

main().catch(console.error).finally(() => process.exit(0));
