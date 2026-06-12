'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';

// 1. Fetch Calendar Events (Admin & User)
export async function getCalendarEvents(forUser = false) {
    const where: any = { publishToCalendar: true };
    // Users generally only see "Forming" batches they can join
    // Admins might want to see Scheduled ones too if we want a unified calendar
    if (forUser) {
        where.status = 'Forming';
    }

    return await db.nominationBatch.findMany({
        where,
        include: {
            program: true,
            nominations: true,
            trainingSession: true
        },
        orderBy: { proposedStartDate: 'asc' }
    });
}

// 2. Create Pre-Scheduled Event (Admin)
export async function createCalendarEvent(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    const programId = formData.get('programId') as string;
    const proposedStartDate = formData.get('proposedStartDate') as string;
    const proposedEndDate = formData.get('proposedEndDate') as string;
    const proposedTrainer = formData.get('proposedTrainer') as string;
    const proposedLocation = formData.get('proposedLocation') as string;
    const capacity = formData.get('capacity') as string;
    
    if (!programId || !proposedStartDate || !proposedEndDate) {
        return { error: 'Missing required fields' };
    }

    try {
        const program = await db.program.findUnique({ where: { id: programId } });
        if (!program) return { error: 'Program not found' };

        await db.nominationBatch.create({
            data: {
                name: `${program.name} - Planned Event`,
                programId,
                status: 'Forming',
                proposedStartDate: new Date(proposedStartDate),
                proposedEndDate: new Date(proposedEndDate),
                proposedTrainer: proposedTrainer || null,
                proposedLocation: proposedLocation || null,
                capacity: capacity ? parseInt(capacity) : 20,
                publishToCalendar: true
            }
        });

        revalidateTag('sessions-list', 'max');
        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Create Calendar Event Error:', error);
        return { error: 'Failed to create calendar event' };
    }
}

// 3. Confirm Event and generate TrainingSession (Admin)
export async function confirmCalendarEvent(batchId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    const trainerName = formData.get('trainerName') as string;
    const location = formData.get('location') as string;
    const startTime = formData.get('startTime') as string || "8:30 am";
    const endTime = formData.get('endTime') as string || "6:00 pm";

    try {
        const batch = await db.nominationBatch.findUnique({
            where: { id: batchId },
            include: { program: true }
        });

        if (!batch || !batch.proposedStartDate || !batch.proposedEndDate) {
            return { error: 'Invalid batch or missing proposed dates' };
        }

        // Generate the final TrainingSession
        const assessmentDate = new Date(batch.proposedEndDate.getTime() + 20 * 24 * 60 * 60 * 1000);

        await db.trainingSession.create({
            data: {
                programName: batch.program.name,
                trainerName,
                startDate: batch.proposedStartDate,
                endDate: batch.proposedEndDate,
                startTime,
                endTime,
                location,
                topics: batch.program.objectives,
                assessmentDate,
                feedbackCreationDate: assessmentDate,
                nominationBatchId: batch.id
            }
        });

        // Update Batch Status
        await db.nominationBatch.update({
            where: { id: batch.id },
            data: { 
                status: 'Scheduled',
                publishToCalendar: false // Hide from "Upcoming/Forming" calendar view
            }
        });

        revalidateTag('sessions-list', 'max');
        revalidateTag('session-details', 'max');
        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Confirm Calendar Event Error:', error);
        return { error: 'Failed to confirm event' };
    }
}

// 4. Delete/Cancel Event (Admin)
export async function cancelCalendarEvent(batchId: string) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    try {
        await db.nominationBatch.delete({
            where: { id: batchId }
        });

        revalidateTag('sessions-list', 'max');
        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Cancel Calendar Event Error:', error);
        return { error: 'Failed to cancel event' };
    }
}

// 5. Self-Nominate into Calendar Event (Employee)
export async function selfNominateCalendar(batchId: string, empId: string, justification: string) {
    try {
        const batch = await db.nominationBatch.findUnique({
            where: { id: batchId },
            include: { program: true }
        });

        if (!batch) return { error: 'Event not found' };
        if (batch.status !== 'Forming') return { error: 'This event is no longer accepting self-nominations' };

        // Check if already nominated for this specific batch
        const existing = await db.nomination.findFirst({
            where: { empId, batchId }
        });

        if (existing) return { error: 'You are already nominated for this event' };

        // Check Capacity
        const currentCount = await db.nomination.count({ where: { batchId } });
        if (batch.capacity && currentCount >= batch.capacity) {
            return { error: 'This event is full' };
        }

        // Create Nomination mapped to the batch
        await db.nomination.create({
            data: {
                empId,
                programId: batch.programId,
                batchId,
                status: 'Pending', // Pending admin/manager review (or could be 'Batched' if auto-approved)
                source: 'CALENDAR',
                justification: justification || 'Self-nominated from calendar',
                managerApprovalStatus: 'Pending' // Still requires manager approval like regular TNI
            }
        });

        // Trigger standard manager approval email logic if desired
        // (Could reuse logic from tni.ts)

        revalidateTag('employee-profile', 'max');
        return { success: true };
    } catch (error) {
        console.error('Self Nominate Error:', error);
        return { error: 'Failed to submit nomination' };
    }
}
