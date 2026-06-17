'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';

export async function deleteTrainingSession(sessionId: string) {
    const session = await auth();
    if (!session?.user?.email && process.env.NODE_ENV !== 'development') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const trainingSession = await db.trainingSession.findUnique({
            where: { id: sessionId }
        });

        if (!trainingSession) {
            return { success: false, error: 'Session not found.' };
        }

        const batchId = trainingSession.nominationBatchId;

        // If there's a batch tied to it, we revert its nominations and delete the batch
        if (batchId) {
            // Revert all nominations in this batch back to the pending pool
            await db.nomination.updateMany({
                where: { batchId },
                data: { 
                    status: 'Pending',
                    managerApprovalStatus: 'Approved',
                    batchId: null
                }
            });

            // Delete the training session first due to relation
            await db.trainingSession.delete({
                where: { id: sessionId }
            });

            // Delete the underlying batch
            await db.nominationBatch.delete({
                where: { id: batchId }
            });
        } else {
            // No batch found, just delete the session
            await db.trainingSession.delete({
                where: { id: sessionId }
            });
        }

        revalidatePath('/admin/sessions');
        revalidatePath('/admin/tni-dashboard');
        // @ts-ignore
        revalidateTag('sessions-list');

        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete training session:', error);
        return { success: false, error: error.message || 'Failed to delete scheduled session.' };
    }
}
