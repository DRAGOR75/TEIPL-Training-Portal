import 'dotenv/config';
import { db } from '../lib/prisma';

async function audit() {
    // 1. Check locations created today (or after 2026-09-18T00:00:00Z)
    const today = new Date('2026-09-18T00:00:00Z');

    const recentLocations = await db.location.findMany({
        where: { createdAt: { gte: today } },
        orderBy: { createdAt: 'asc' }
    });

    const recentTrainers = await db.trainer.findMany({
        where: { createdAt: { gte: today } },
        orderBy: { createdAt: 'asc' }
    });

    // Program table doesn't have createdAt in schema, let's check schema for Program fields
    // Wait, let's check programs created or linked to batches created today
    const recentBatches = await db.nominationBatch.findMany({
        where: { createdAt: { gte: today } },
        include: { program: true },
        orderBy: { createdAt: 'asc' }
    });

    const recentSessions = await db.trainingSession.findMany({
        where: { createdAt: { gte: today } },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`=== AUDIT REPORT (Records created on or after ${today.toISOString()}) ===`);
    console.log(`Locations created: ${recentLocations.length}`);
    console.log(recentLocations.map(l => ({ id: l.id, name: l.name, createdAt: l.createdAt })));

    console.log(`\nTrainers created: ${recentTrainers.length}`);
    console.log(recentTrainers.map(t => ({ id: t.id, name: t.name, createdAt: t.createdAt })));

    console.log(`\nNomination Batches created: ${recentBatches.length}`);
    console.log(`Training Sessions created: ${recentSessions.length}`);
}

audit()
    .catch(console.error)
    .finally(() => db.$disconnect());
