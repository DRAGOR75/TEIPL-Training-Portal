'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export type BulkSessionRow = {
    programId: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    trainerName?: string;
    location?: string;
    topics?: string;
};

export async function bulkUploadSessions(rows: BulkSessionRow[]) {
    const session = await auth();
    if (!session?.user?.email && process.env.NODE_ENV !== 'development') {
        return { success: false, error: 'Unauthorized' };
    }

    let successCount = 0;
    let errors: string[] = [];

    for (const [index, row] of rows.entries()) {
        try {
            if (!row.programId || !row.startDate || !row.endDate) {
                throw new Error('Missing required fields (Program ID, Start Date, End Date)');
            }

            const program = await db.program.findUnique({
                where: { id: row.programId },
                select: { id: true, name: true }
            });

            if (!program) {
                throw new Error(`Program ID '${row.programId}' not found.`);
            }

            const startDate = new Date(row.startDate);
            const endDate = new Date(row.endDate);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Invalid date format');
            }

            // Create NominationBatch
            const batch = await db.nominationBatch.create({
                data: {
                    name: `${program.name} - ${startDate.toLocaleDateString()}`,
                    programId: program.id,
                    status: 'Scheduled',
                    proposedStartDate: startDate,
                    proposedEndDate: endDate,
                    proposedTrainer: row.trainerName,
                    proposedLocation: row.location,
                    publishToCalendar: true
                }
            });

            // Auto-calculate Assessment Date (+30 days)
            const feedbackCreationDate = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);

            // Create TrainingSession
            await db.trainingSession.create({
                data: {
                    programName: program.name,
                    trainerName: row.trainerName || null,
                    startDate: startDate,
                    endDate: endDate,
                    startTime: row.startTime || "8:30 am",
                    endTime: row.endTime || "6:00 pm",
                    location: row.location || null,
                    topics: row.topics || null,
                    nominationBatchId: batch.id,
                    feedbackCreationDate: feedbackCreationDate,
                    assessmentDate: feedbackCreationDate
                }
            });

            successCount++;
        } catch (error: any) {
            errors.push(`Row ${index + 1}: ${error.message}`);
        }
    }

    revalidatePath('/admin/sessions');
    revalidatePath('/calendar');
    revalidatePath('/admin/planning');

    if (errors.length > 0 && successCount === 0) {
        return { success: false, count: successCount, error: errors.join(' | ') };
    } else if (errors.length > 0) {
        return { success: true, count: successCount, error: `Partial success. ${successCount} imported. Errors: ` + errors.join(' | ') };
    }

    return { success: true, count: successCount };
}
