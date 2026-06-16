'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function updateSession(sessionId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email && process.env.NODE_ENV !== 'development') {
        return { success: false, error: 'Unauthorized' };
    }

    const startDateRaw = formData.get('startDate') as string;
    const endDateRaw = formData.get('endDate') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const trainerName = formData.get('trainerName') as string;
    const location = formData.get('location') as string;
    const topics = formData.get('topics') as string;
    const assessmentDateRaw = formData.get('assessmentDate') as string;

    if (!startDateRaw || !endDateRaw) {
        return { success: false, error: 'Start Date and End Date are required.' };
    }

    const startDate = new Date(startDateRaw);
    const endDate = new Date(endDateRaw);
    let assessmentDate = assessmentDateRaw ? new Date(assessmentDateRaw) : undefined;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { success: false, error: 'Invalid date format provided.' };
    }

    try {
        const existingSession = await db.trainingSession.findUnique({
            where: { id: sessionId },
            include: { nominationBatch: true }
        });

        if (!existingSession) {
            return { success: false, error: 'Session not found.' };
        }

        // If assessmentDate isn't provided, calculate it if endDate changed
        if (!assessmentDate && existingSession.endDate.getTime() !== endDate.getTime()) {
            assessmentDate = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        const dataToUpdate: any = {
            startDate,
            endDate,
            startTime,
            endTime,
            trainerName: trainerName || null,
            location: location || null,
            topics: topics || null
        };

        if (assessmentDate) {
            dataToUpdate.assessmentDate = assessmentDate;
            dataToUpdate.feedbackCreationDate = assessmentDate;
        }

        await db.trainingSession.update({
            where: { id: sessionId },
            data: dataToUpdate
        });

        // Also update the proposed dates on the batch just to keep them in sync
        if (existingSession.nominationBatchId) {
            await db.nominationBatch.update({
                where: { id: existingSession.nominationBatchId },
                data: {
                    proposedStartDate: startDate,
                    proposedEndDate: endDate,
                    proposedTrainer: trainerName || null,
                    proposedLocation: location || null
                }
            });
        }

        revalidatePath('/admin/sessions');
        revalidatePath('/calendar');
        revalidatePath('/admin/planning');
        revalidatePath(`/admin/sessions/${sessionId}/manage`);

        return { success: true };
    } catch (error: any) {
        console.error('Failed to update session:', error);
        return { success: false, error: error.message || 'Failed to update session.' };
    }
}
