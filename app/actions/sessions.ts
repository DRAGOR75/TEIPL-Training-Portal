'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'; // Added cache imports
import { redirect } from 'next/navigation';

export async function createSession(formData: FormData) {
    const programName = formData.get('programName') as string;
    const trainerName = formData.get('trainerName') as string;
    const startDate = new Date(formData.get('startDate') as string);
    const endDate = new Date(formData.get('endDate') as string);

    if (!programName || !startDate || !endDate) {
        throw new Error('Missing required fields');
    }

    try {
        const program = await db.program.findUnique({
            where: { name: programName }
        });

        if (!program) {
            throw new Error(`Program '${programName}' not found.`);
        }

        const batch = await db.nominationBatch.create({
            data: {
                name: `${programName} - ${startDate.toLocaleDateString()}`,
                programId: program.id,
                status: 'Forming'
            }
        });

        const session = await db.trainingSession.create({
            data: {
                programName,
                trainerName,
                startDate,
                endDate,
                nominationBatchId: batch.id
            }
        });

        // revalidateTag removed due to build error
        revalidatePath('/admin/sessions');
        return { success: true, sessionId: session.id };
    } catch (error) {
        console.error('Create Session Error:', error);
        return { error: 'Failed to create session' };
    }
}

// CACHED: Session List
// CACHED: Session List (Micro-Caching: 1 second)
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
    { revalidate: 1 }
);

// CACHED: Single Session
// CACHED: Single Session (Micro-Caching: 1 second)
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
    { revalidate: 1 }
);

export async function getPendingNominationsForProgram(programId: string) {
    return await db.nomination.findMany({
        where: {
            programId,
            status: 'Pending'
        },
        include: {
            employee: true
        }
    });
}

export async function addNominationsToBatch(batchId: string, nominationIds: string[]) {
    try {
        await db.nomination.updateMany({
            where: {
                id: { in: nominationIds }
            },
            data: {
                batchId,
                status: 'Batched'
            }
        });

        // revalidateTag removed due to build error
        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Add Nominations Error:', error);
        return { error: 'Failed to add nominations' };
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
            include: { program: true }
        });

        if (!batch) {
            return { error: 'Invalid Batch ID.' };
        }

        // 4. Create Nomination
        await db.nomination.create({
            data: {
                empId,
                programId: batch.programId,
                batchId,
                status: 'Batched',
                source: 'QR',
                justification: 'Self-Enrollment via QR Scan'
            }
        });

        // revalidateTag removed due to build error (Expected 2 args)
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
            include: { program: true }
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
        await db.nomination.create({
            data: {
                empId: employee.id,
                programId: batch.programId,
                batchId,
                status: 'Batched',
                source: 'QR',
                justification: 'JIT Registration via QR Scan'
            }
        });

        revalidatePath(`/admin/sessions`);
        return { success: true, employeeName: employee.name, programName: batch.program.name };

    } catch (error) {
        console.error('Register and Join Error:', error);
        return { error: 'Failed to register and enroll. Please try again.' };
    }
}
