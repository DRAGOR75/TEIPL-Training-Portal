'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';

export async function updateBatch(batchId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email && process.env.NODE_ENV !== 'development') {
        return { success: false, error: 'Unauthorized' };
    }

    const startDateRaw = formData.get('startDate') as string;
    const endDateRaw = formData.get('endDate') as string;
    const trainerName = formData.get('trainerName') as string;
    const location = formData.get('location') as string;

    if (!startDateRaw || !endDateRaw) {
        return { success: false, error: 'Start Date and End Date are required.' };
    }

    const startDate = new Date(startDateRaw);
    const endDate = new Date(endDateRaw);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { success: false, error: 'Invalid date format provided.' };
    }

    try {
        const batch = await db.nominationBatch.findUnique({
            where: { id: batchId }
        });

        if (!batch) {
            return { success: false, error: 'Batch not found.' };
        }

        await db.nominationBatch.update({
            where: { id: batchId },
            data: {
                proposedStartDate: startDate,
                proposedEndDate: endDate,
                proposedTrainer: trainerName || null,
                proposedLocation: location || null
            }
        });

        revalidatePath('/admin/sessions');
        revalidatePath('/admin/tni-dashboard');
        revalidatePath(`/admin/batches/${batchId}/manage`);
        // @ts-ignore
        revalidateTag('sessions-list');

        return { success: true };
    } catch (error: any) {
        console.error('Failed to update batch:', error);
        return { success: false, error: error.message || 'Failed to update pre-scheduled event.' };
    }
}
