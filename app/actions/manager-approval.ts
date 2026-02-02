'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function submitManagerNominationDecision(nominationId: string, decision: 'Approved' | 'Rejected', reason?: string) {
    try {
        const updateData: any = {
            managerApprovalStatus: decision,
            managerRejectionReason: reason || null,
        };

        // If Rejected for a session, remove from batch and reset to 'Pending'
        // (This moves them out of the ready-to-batch waitlist for fresh review)
        if (decision === 'Rejected') {
            updateData.status = 'Pending';
            updateData.batchId = null;
        }

        await db.nomination.update({
            where: { id: nominationId },
            data: updateData
        });

        // Revalidate potential paths
        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error("Manager Decision Error:", error);
        return { success: false, error: "Failed to submit decision" };
    }
}
