'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';

export async function cancelTrainingSession(sessionId: string, reason: string) {
    const session = await auth();
    if (!session?.user?.email && process.env.NODE_ENV !== 'development') {
        return { success: false, error: 'Unauthorized' };
    }

    if (!reason || reason.trim() === '') {
        return { success: false, error: 'Cancellation reason is required.' };
    }

    try {
        const trainingSession = await db.trainingSession.findUnique({
            where: { id: sessionId }
        });

        if (!trainingSession) {
            return { success: false, error: 'Session not found.' };
        }

        const batchId = trainingSession.nominationBatchId;

        // 1. Update the training session to cancelled
        await db.trainingSession.update({
            where: { id: sessionId },
            data: {
                status: 'Cancelled',
                cancellationReason: reason
            }
        });

        // 2. If there's a batch, revert the nominations back to Pending
        if (batchId) {
            await db.nomination.updateMany({
                where: { batchId },
                data: { 
                    status: 'Pending',
                    managerApprovalStatus: 'Approved',
                    batchId: null
                }
            });

            // Mark the batch as cancelled as well
            await db.nominationBatch.update({
                where: { id: batchId },
                data: {
                    status: 'Cancelled'
                }
            });
        }

        revalidatePath('/admin/sessions');
        revalidatePath('/admin/tni-dashboard');
        // @ts-ignore
        revalidateTag('sessions-list');

        return { success: true };
    } catch (error: any) {
        console.error('Failed to cancel training session:', error);
        return { success: false, error: error.message || 'Failed to cancel scheduled session.' };
    }
}
