import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Verify CRON Secret (Vercel automatic header)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const today = new Date();

        // 2. Find all Scheduled batches where the session's endDate is in the past
        // We use endOfDay to make sure it only completes AFTER the full end date has passed.
        // Assuming endDate is just a Date object (often at 00:00:00), we complete it if today > endDate.
        const completedBatches = await db.nominationBatch.findMany({
            where: {
                status: 'Scheduled',
                trainingSession: {
                    endDate: {
                        lt: today // Less than current date/time
                    }
                },
                nominations: {
                    some: {} // Only complete if there is at least 1 participant
                }
            },
            select: { id: true, name: true }
        });

        if (completedBatches.length === 0) {
            return NextResponse.json({ message: 'No sessions to complete.' }, { status: 200 });
        }

        const batchIds = completedBatches.map(b => b.id);

        // 3. Update the batches to 'Completed'
        const result = await db.nominationBatch.updateMany({
            where: {
                id: { in: batchIds }
            },
            data: {
                status: 'Completed'
            }
        });

        // Sync the training sessions' status to 'Completed'
        await db.trainingSession.updateMany({
            where: {
                nominationBatchId: { in: batchIds }
            },
            data: {
                status: 'Completed'
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `Successfully completed ${result.count} session(s).`,
            batchesCompleted: completedBatches.map(b => b.name)
        }, { status: 200 });

    } catch (error: any) {
        console.error("Cron Error Completing Sessions:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
