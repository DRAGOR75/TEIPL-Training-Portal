'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'; // Added cache imports
import { sendEmail, sendFeedbackRequestEmail, sendManagerRejectionNotification, sendFeedbackReviewRequestEmail, sendManagerSessionApprovalEmail } from '@/lib/email';
import { SessionWithDetails } from '@/types/sessions';
import { auth } from "@/auth";

export async function lockSessionBatch(sessionId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const trainingSession = await db.trainingSession.findUnique({
            where: { id: sessionId },
            select: { nominationBatchId: true }
        });

        if (!trainingSession || !trainingSession.nominationBatchId) {
            return { success: false, error: "Session or Batch not found" };
        }

        const result = await db.nominationBatch.updateMany({
            where: {
                id: trainingSession.nominationBatchId,
                status: 'Forming' // Guard: Only lock if currently Forming
            },
            data: { status: 'Scheduled' }
        });

        if (result.count === 0) {
            // Check why it failed (Already Scheduled is fine, Completed is bad to overwrite)
            const currentBatch = await db.nominationBatch.findUnique({
                where: { id: trainingSession.nominationBatchId },
                select: { status: true }
            });

            if (currentBatch?.status === 'Completed') {
                return { success: false, error: "Cannot lock a Completed batch." };
            }
            // If it was already Scheduled, that's fine, treat as success or ignore.
        }

        revalidatePath(`/admin/dashboard/session/${sessionId}`);
        revalidatePath(`/admin/sessions/${sessionId}/manage`);
        revalidatePath('/admin/sessions');
        revalidateTag('sessions-list');
        revalidateTag('session-details');
        return { success: true };
    } catch (error) {
        console.error("Lock Batch Error:", error);
        return { success: false, error: "Database error" };
    }
}


export async function createSession(formData: FormData) {
    const session = await auth();
    // Align with auth.ts middleware bypass in development
    if (!session?.user?.email && process.env.NODE_ENV !== 'development') {
        return { error: "Unauthorized" };
    }
    const programName = formData.get('programName') as string;
    const trainerName = formData.get('trainerName') as string;
    const startDateRaw = formData.get('startDate') as string;
    const endDateRaw = formData.get('endDate') as string;

    if (!programName || !startDateRaw || !endDateRaw) {
        return { error: 'Missing required fields' };
    }

    const startDate = new Date(startDateRaw);
    const endDate = new Date(endDateRaw);

    try {
        const program = await db.program.findUnique({
            where: { name: programName }
        });

        if (!program) {
            return { error: `Program '${programName}' not found.` };
        }

        const batch = await db.nominationBatch.create({
            data: {
                name: `${programName} - ${startDate.toLocaleDateString()}`,
                programId: program.id,
                status: 'Forming'
            }
        });

        const trainingSession = await db.trainingSession.create({
            data: {
                programName,
                trainerName,
                startDate,
                endDate,
                location: formData.get('location') as string,
                topics: formData.get('topics') as string,
                nominationBatchId: batch.id
            }
        });

        revalidateTag('sessions-list');
        revalidateTag('session-details');
        revalidatePath('/admin/sessions');
        return { success: true, sessionId: trainingSession.id };
    } catch (error) {
        console.error('Create Session Error:', error);
        return { error: 'Failed to create session' };
    }
}

// CACHED: Session List
// CACHED: Session List (Micro-Caching: 1 hour)
// This prevents DB floods (1000 reqs -> 1 DB call) while keeping UI "real-time" for admins.
export const getSessions = unstable_cache(
    async () => {
        return await db.trainingSession.findMany({
            orderBy: { startDate: 'desc' },
            include: {
                nominationBatch: {
                    include: {
                        nominations: true
                    }
                }
            }
        });
    },
    ['sessions-list'],
    { revalidate: 3600, tags: ['sessions-list'] } // 1 hour cache
);

// CACHED: Single Session
// CACHED: Single Session (Micro-Caching: 1 hour)
export const getSessionById = unstable_cache(
    async (sessionId: string) => {
        return await db.trainingSession.findUnique({
            where: { id: sessionId },
            include: {
                nominationBatch: {
                    include: {
                        nominations: {
                            include: { employee: true }
                        },
                        program: true
                    }
                }
            }
        });
    },
    ['session-details'],
    { revalidate: 3600, tags: ['session-details'] } // 1 hour cache
);

export async function getTrainingSessionsForDate(dateStr: string): Promise<SessionWithDetails[]> {
    try {
        // Create dates in local time (assuming server acts as IST or we want full day coverage regardless of UTC shift)
        // Alternatively, shift UTC to match IST 00:00 to 23:59
        // IST is UTC+5:30.
        // 00:00 IST = Prev Day 18:30 UTC.
        // 23:59 IST = Today 18:29 UTC.
        // Ideally, we construct the date object using the input string and force it to be start/end of that day.

        const startOfDay = new Date(dateStr + "T00:00:00.000+05:30");
        const endOfDay = new Date(dateStr + "T23:59:59.999+05:30");

        return await db.trainingSession.findMany({
            where: {
                startDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            orderBy: { startDate: 'desc' },
            include: {
                nominationBatch: {
                    include: {
                        nominations: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Get Training Sessions For Date Error:', error);
        return [];
    }
}

export async function getPendingNominationsForProgram(programId: string) {
    const nominations = await db.nomination.findMany({
        where: {
            programId,
            status: { in: ['Pending', 'Approved'] },
            // Extra safety: If manager explicitly rejected the topic, don't show here 
            // even if status was bugged to 'Pending' in old records.
            managerApprovalStatus: { not: 'Rejected' }
        },
        include: {
            employee: true
        }
    });

    const statusPriority: Record<string, number> = {
        'Approved': 1,
        'Pending': 2,
    };

    return nominations.sort((a, b) =>
        (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99)
    );
}

export async function addNominationsToBatch(batchId: string, nominationIds: string[]) {
    console.log('🚀 addNominationsToBatch called:', { batchId, nominationIds });
    const session = await auth();

    // Auth Bypass for local development
    if (!session?.user?.email && process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Dev Mode: Bypassing auth check for batch update');
    } else if (!session?.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // 0. Check Batch Lock Status
        const preCheckBatch = await db.nominationBatch.findUnique({
            where: { id: batchId },
            select: { status: true }
        });

        if (!preCheckBatch) return { success: false, error: "Batch not found." };
        if (preCheckBatch?.status === 'Scheduled' || preCheckBatch?.status === 'Completed') {
            return { success: false, error: "Batch is locked." };
        }

        // 1. Update Database
        const updateResult = await db.nomination.updateMany({
            where: { id: { in: nominationIds } },
            data: {
                batchId,
                status: 'Batched',
                managerApprovalStatus: 'Pending'
            }
        });
        console.log('✅ Updated nominations:', updateResult.count);

        // 2. Fetch details for emails
        const batch = await db.nominationBatch.findUnique({
            where: { id: batchId },
            include: {
                trainingSession: true,
                program: true
            }
        });

        if (batch?.trainingSession) {
            const nominations = await db.nomination.findMany({
                where: { id: { in: nominationIds } },
                include: { employee: true }
            });

            const { startDate, endDate } = batch.trainingSession;
            await Promise.all(nominations.map(async (nom) => {
                if (nom.employee.managerEmail) {
                    await sendManagerSessionApprovalEmail(
                        nom.employee.managerEmail,
                        nom.employee.managerName,
                        nom.employee.name,
                        batch.program.name,
                        startDate,
                        endDate,
                        nom.id
                    ).catch(err => console.error("❌ Email failed for", nom.employee.name, err));
                }
            }));
        }

        revalidateTag('employee-profile');
        revalidateTag('sessions-list');
        revalidateTag('session-details');
        revalidatePath('/admin/sessions');
        if (batch?.trainingSession?.id) {
            revalidatePath(`/admin/sessions/${batch.trainingSession.id}/manage`);
        }

        return { success: true };
    } catch (error) {
        console.error('❌ addNominationsToBatch Error:', error);
        return { success: false, error: 'Failed to update database.' };
    }
}

export async function joinBatch(batchId: string, empId: string) {
    try {
        // 1. Check if Employee exists
        const employee = await db.employee.findUnique({
            where: { id: empId }
        });

        if (!employee) {
            return { error: 'EMPLOYEE_NOT_FOUND' }; // Signal to UI to show registration form
        }

        // 2. Check if already nominated/enrolled
        const existing = await db.nomination.findFirst({
            where: {
                empId,
                batchId
            }
        });

        if (existing) {
            return { error: 'You are already enrolled in this session.' };
        }

        // 3. Get Batch to find Program ID (needed for Nomination)
        const batch = await db.nominationBatch.findUnique({
            where: { id: batchId },
            include: {
                program: true,
                trainingSession: true
            }
        });

        if (!batch) {
            return { error: 'Invalid Batch ID.' };
        }



        // 4. Create Nomination
        const nomination = await db.nomination.create({
            data: {
                empId,
                programId: batch.programId,
                batchId,
                status: 'Batched',
                source: 'QR',
                justification: 'Self-Enrollment via QR Scan'
            }
        });

        // 5. Send Email if Session exists
        if (batch.trainingSession && employee.managerEmail) {
            const { startDate, endDate } = batch.trainingSession;
            await sendManagerSessionApprovalEmail(
                employee.managerEmail,
                employee.managerName,
                employee.name,
                batch.program.name,
                startDate,
                endDate,
                nomination.id
            ).catch(console.error);
        }

        revalidateTag('employee-profile');
        revalidateTag('sessions-list');
        revalidateTag('session-details');
        revalidatePath(`/admin/sessions`); // Update admin view
        return { success: true, employeeName: employee.name, programName: batch.program.name };

    } catch (error) {
        console.error('Join Batch Error:', error);
        return { error: 'Failed to join session. Please try again.' };
    }
}

export async function registerAndJoinBatch(batchId: string, formData: {
    empId: string;
    name: string;
    email: string;
    sectionName: string;
    designation: string;
    mobile: string;
    grade: 'EXECUTIVE' | 'WORKMAN';
    location: string;
    yearsOfExperience: string;
    subDepartment: string;
    managerName: string;
    managerEmail: string;
}) {
    try {
        // 1. Double check batch validity
        const batch = await db.nominationBatch.findUnique({
            where: { id: batchId },
            include: {
                program: true,
                trainingSession: true
            }
        });

        if (!batch) {
            return { error: 'Invalid Batch ID.' };
        }

        // 2. Create Employee with ALL master fields
        // Use upsert just in case of race condition or if they were deactivated
        const employee = await db.employee.upsert({
            where: { id: formData.empId },
            update: {
                name: formData.name,
                email: formData.email,
                sectionName: formData.sectionName,
                designation: formData.designation,
                mobile: formData.mobile,
                grade: formData.grade,
                location: formData.location,
                yearsOfExperience: formData.yearsOfExperience,
                subDepartment: formData.subDepartment,
                managerName: formData.managerName,
                managerEmail: formData.managerEmail
            },
            create: {
                id: formData.empId,
                name: formData.name,
                email: formData.email,
                sectionName: formData.sectionName,
                designation: formData.designation,
                mobile: formData.mobile,
                grade: formData.grade,
                location: formData.location,
                yearsOfExperience: formData.yearsOfExperience,
                subDepartment: formData.subDepartment,
                managerName: formData.managerName,
                managerEmail: formData.managerEmail
            }
        });

        // 3. Create Nomination
        const nomination = await db.nomination.create({
            data: {
                empId: employee.id,
                programId: batch.programId,
                batchId,
                status: 'Batched',
                source: 'QR',
                justification: 'JIT Registration via QR Scan'
            }
        });

        // 4. Send Email if Session exists
        // Note: We use formData.managerEmail because employee object return from upsert might not have it if upsert return behavior varies, 
        // but robustly we should use employee.managerEmail or formData.managerEmail.
        if (batch.trainingSession && formData.managerEmail) {
            const { startDate, endDate } = batch.trainingSession;
            await sendManagerSessionApprovalEmail(
                formData.managerEmail,
                formData.managerName,
                formData.name,
                batch.program.name,
                startDate,
                endDate,
                nomination.id
            ).catch(console.error);
        }

        revalidateTag('employee-profile');
        revalidateTag('sessions-list');
        revalidateTag('session-details');
        revalidatePath(`/admin/sessions`);
        return { success: true, employeeName: employee.name, programName: batch.program.name };

    } catch (error) {

        console.error('Register and Join Error:', error);
        return { error: 'Failed to register and enroll. Please try again.' };
    }
}

export async function removeNominationFromBatch(nominationId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, error: "Unauthorized" };
    }
    try {
        // 0. Check Batch Lock via Nomination -> Batch
        const nomination = await db.nomination.findUnique({
            where: { id: nominationId },
            include: { batch: true }
        });

        if (nomination?.batch?.status === 'Scheduled' || nomination?.batch?.status === 'Completed') {
            return { success: false, error: "Batch is locked." };
        }

        await db.nomination.update({
            where: { id: nominationId },
            data: {
                batchId: null,
                status: 'Pending',
                managerApprovalStatus: 'Pending', // Reset approval flow
                managerRejectionReason: null      // Clean up any old rejection reasons
            }
        });

        revalidatePath('/admin/sessions');
        revalidateTag('sessions-list');
        revalidateTag('session-details');
        return { success: true };
    } catch (error) {
        console.error('Remove Nomination Error:', error);
        return { error: 'Failed to remove participant.' };
    }
}
