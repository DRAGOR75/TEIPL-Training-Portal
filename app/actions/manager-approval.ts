'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function submitManagerNominationDecision(nominationId: string, decision: 'Approved' | 'Rejected', reason?: string) {
    try {
        const nomination = await db.nomination.findUnique({
            where: { id: nominationId },
            select: { status: true, empId: true }
        });

        if (!nomination) return { error: "Nomination not found" };

        const updateData: any = {
            managerApprovalStatus: decision,
            managerRejectionReason: reason || null,
        };

        // Sync main status field for dashboard consistency
        if (decision === 'Approved') {
            // Only move to 'Approved' if it's currently 'Pending' (TNI Phase)
            // If it's already 'Batched', keep it as 'Batched'
            if (nomination.status === 'Pending') {
                updateData.status = 'Approved';
            }
        } else {
            // Rejected
            if (nomination.status === 'Batched') {
                // Rejected a specific session: return to TNI pool
                updateData.status = 'Pending';
                updateData.batchId = null;
            } else {
                // Rejected TNI request
                updateData.status = 'Rejected';
            }
        }

        await db.nomination.update({
            where: { id: nominationId },
            data: updateData
        });

        // Revalidate Paths
        revalidatePath(`/tni/${nomination.empId}`);
        revalidatePath(`/manager/approval/${nominationId}`);
        revalidatePath('/admin/sessions');

        // Revalidate Tags
        revalidateTag('employee-profile', 'max');
        revalidateTag('manager-approval', 'max');
        revalidateTag('sessions-list', 'max');
        revalidateTag('session-details', 'max');

        return { success: true };
    } catch (error) {
        console.error("Manager Decision Error:", error);
        return { success: false, error: "Failed to submit decision" };
    }
}
