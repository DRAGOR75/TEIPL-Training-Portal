'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ========== READ OPERATIONS ==========

/**
 * Get all cohorts with member counts and program progress.
 */
export async function getCohorts() {
    try {
        const cohorts = await db.cohort.findMany({
            include: {
                programs: {
                    include: {
                        program: { select: { name: true } },
                        session: { select: { id: true, startDate: true, endDate: true } },
                    },
                    orderBy: { seq: 'asc' },
                },
                members: {
                    include: {
                        employee: { select: { id: true, name: true, email: true } },
                    },
                },
                _count: {
                    select: { members: true, programs: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return cohorts;
    } catch (error) {
        console.error('Failed to fetch cohorts:', error);
        return [];
    }
}

/**
 * Get a single cohort with full details.
 */
export async function getCohortById(cohortId: string) {
    try {
        const cohort = await db.cohort.findUnique({
            where: { id: cohortId },
            include: {
                programs: {
                    include: {
                        program: { select: { id: true, name: true, category: true } },
                        session: {
                            select: {
                                id: true,
                                programName: true,
                                trainerName: true,
                                startDate: true,
                                endDate: true,
                                startTime: true,
                                endTime: true,
                                location: true,
                                nominationBatchId: true,
                                nominationBatch: {
                                    select: {
                                        id: true,
                                        status: true,
                                        _count: { select: { nominations: true } },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { seq: 'asc' },
                },
                members: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                sectionName: true,
                                designation: true,
                                managerName: true,
                                managerEmail: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
                feedbacks: {
                    include: {
                        employee: { select: { id: true, name: true } },
                    },
                },
                _count: {
                    select: { members: true, programs: true },
                },
            },
        });

        return cohort;
    } catch (error) {
        console.error('Failed to fetch cohort:', error);
        return null;
    }
}

// ========== WRITE OPERATIONS ==========

/**
 * Create a new cohort with a list of programs.
 */
export async function createCohort(data: {
    name: string;
    description?: string;
    programIds: string[]; // Ordered list of program IDs
}) {
    try {
        const cohort = await db.cohort.create({
            data: {
                name: data.name,
                description: data.description,
                programs: {
                    create: data.programIds.map((programId, index) => ({
                        programId,
                        seq: index + 1,
                    })),
                },
            },
            include: {
                programs: { include: { program: true } },
            },
        });

        revalidatePath('/admin/cohorts');
        return { success: true, cohort };
    } catch (error) {
        console.error('Failed to create cohort:', error);
        return { success: false, error: 'Failed to create cohort.' };
    }
}

/**
 * Update cohort details (name, description, status).
 */
export async function updateCohort(cohortId: string, data: {
    name?: string;
    description?: string;
    status?: string;
}) {
    try {
        const cohort = await db.cohort.update({
            where: { id: cohortId },
            data,
        });

        revalidatePath('/admin/cohorts');
        revalidatePath(`/admin/cohorts/${cohortId}`);
        return { success: true, cohort };
    } catch (error) {
        console.error('Failed to update cohort:', error);
        return { success: false, error: 'Failed to update cohort.' };
    }
}

/**
 * Add members (employees) to a cohort.
 */
export async function addMembersToCohort(cohortId: string, employeeIds: string[]) {
    try {
        // Filter out employees already in the cohort
        const existing = await db.cohortMember.findMany({
            where: { cohortId, employeeId: { in: employeeIds } },
            select: { employeeId: true },
        });
        const existingIds = new Set(existing.map(e => e.employeeId));
        const newIds = employeeIds.filter(id => !existingIds.has(id));

        if (newIds.length === 0) {
            return { success: true, added: 0, message: 'All employees are already in this cohort.' };
        }

        await db.cohortMember.createMany({
            data: newIds.map(employeeId => ({
                cohortId,
                employeeId,
            })),
        });

        revalidatePath(`/admin/cohorts/${cohortId}`);
        return { success: true, added: newIds.length };
    } catch (error) {
        console.error('Failed to add members:', error);
        return { success: false, error: 'Failed to add members to cohort.' };
    }
}

/**
 * Remove a member from a cohort.
 */
export async function removeMemberFromCohort(cohortId: string, employeeId: string) {
    try {
        await db.cohortMember.delete({
            where: { cohortId_employeeId: { cohortId, employeeId } },
        });

        revalidatePath(`/admin/cohorts/${cohortId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to remove member:', error);
        return { success: false, error: 'Failed to remove member from cohort.' };
    }
}

/**
 * Schedule a session for a CohortProgram. 
 * Auto-creates a batch and adds all cohort members as nominations.
 */
export async function scheduleCohortSession(cohortProgramId: string, sessionData: {
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    trainerName?: string;
    topics?: string;
}) {
    try {
        // 1. Get the CohortProgram + cohort members
        const cohortProgram = await db.cohortProgram.findUnique({
            where: { id: cohortProgramId },
            include: {
                program: true,
                cohort: {
                    include: {
                        members: {
                            where: { status: 'Active' },
                            include: {
                                employee: { select: { id: true, email: true, managerEmail: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!cohortProgram) {
            return { success: false, error: 'Cohort program not found.' };
        }

        if (cohortProgram.sessionId) {
            return { success: false, error: 'A session is already scheduled for this program.' };
        }

        // 2. Create the NominationBatch
        const batch = await db.nominationBatch.create({
            data: {
                name: `${cohortProgram.cohort.name} - ${cohortProgram.program.name}`,
                programId: cohortProgram.programId,
            },
        });

        // 3. Create the TrainingSession
        const session = await db.trainingSession.create({
            data: {
                programName: cohortProgram.program.name,
                trainerName: sessionData.trainerName || null,
                startDate: new Date(sessionData.startDate),
                endDate: new Date(sessionData.endDate),
                startTime: sessionData.startTime || null,
                endTime: sessionData.endTime || null,
                location: sessionData.location || null,
                topics: sessionData.topics || null,
                nominationBatchId: batch.id,
            },
        });

        // 4. Auto-add all cohort members as nominations
        const members = cohortProgram.cohort.members;
        if (members.length > 0) {
            // Intelligently add: If a member already has a PENDING nomination for this program, 
            // move IT into this batch instead of creating a duplicate.
            const memberEmpIds = members.map(m => m.employeeId);

            // 4a. Find existing pending/unbatched nominations for these employees for this program
            const existingNominations = await db.nomination.findMany({
                where: {
                    empId: { in: memberEmpIds },
                    programId: cohortProgram.programId,
                    batchId: null // Only un-batched ones
                }
            });

            const coveredEmpIds = new Set(existingNominations.map(n => n.empId));

            // 4b. Update existing ones
            if (existingNominations.length > 0) {
                await db.nomination.updateMany({
                    where: { id: { in: existingNominations.map(n => n.id) } },
                    data: {
                        batchId: batch.id,
                        status: 'Batched',
                        source: 'COHORT',
                        managerApprovalStatus: 'Approved' // Cohort is pre-approved
                    }
                });
            }

            // 4c. Create new ones for the rest
            const newMembers = members.filter(m => !coveredEmpIds.has(m.employeeId));
            if (newMembers.length > 0) {
                await db.nomination.createMany({
                    data: newMembers.map(member => ({
                        empId: member.employeeId,
                        programId: cohortProgram.programId,
                        batchId: batch.id,
                        status: 'Batched',
                        source: 'COHORT',
                        managerApprovalStatus: 'Approved',
                    })),
                    skipDuplicates: true,
                });
            }
        }

        // 5. Link session to CohortProgram and mark InProgress
        await db.cohortProgram.update({
            where: { id: cohortProgramId },
            data: {
                sessionId: session.id,
                status: 'InProgress',
            },
        });

        // 6. Activate cohort if still Draft
        if (cohortProgram.cohort.status === 'Draft') {
            await db.cohort.update({
                where: { id: cohortProgram.cohortId },
                data: { status: 'Active' },
            });
        }

        revalidatePath(`/admin/cohorts/${cohortProgram.cohortId}`);
        revalidatePath('/admin/sessions');

        return { success: true, sessionId: session.id, batchId: batch.id };
    } catch (error) {
        console.error('Failed to schedule cohort session:', error);
        return { success: false, error: 'Failed to schedule session.' };
    }
}

/**
 * Mark a CohortProgram as completed. Check if all programs are done → graduate members.
 */
export async function markCohortProgramComplete(cohortProgramId: string) {
    try {
        const cp = await db.cohortProgram.update({
            where: { id: cohortProgramId },
            data: { status: 'Completed' },
        });

        // Check if ALL programs in this cohort are completed
        const allPrograms = await db.cohortProgram.findMany({
            where: { cohortId: cp.cohortId },
        });

        const allCompleted = allPrograms.every(p => p.status === 'Completed');

        if (allCompleted) {
            // Mark cohort as Completed
            await db.cohort.update({
                where: { id: cp.cohortId },
                data: { status: 'Completed' },
            });

            // Mark all active members as Completed
            await db.cohortMember.updateMany({
                where: { cohortId: cp.cohortId, status: 'Active' },
                data: {
                    status: 'Completed',
                    completedAt: new Date(),
                },
            });
        }

        revalidatePath(`/admin/cohorts/${cp.cohortId}`);
        return { success: true, cohortCompleted: allCompleted };
    } catch (error) {
        console.error('Failed to mark program complete:', error);
        return { success: false, error: 'Failed to update program status.' };
    }
}

/**
 * Submit cohort-level feedback (the main evaluation).
 */
export async function submitCohortFeedback(data: {
    cohortId: string;
    empId: string;
    rating: number;
    comments?: string;
}) {
    try {
        if (data.rating < 1 || data.rating > 5) {
            return { success: false, error: 'Rating must be between 1 and 5.' };
        }

        const feedback = await db.cohortFeedback.upsert({
            where: {
                cohortId_empId: { cohortId: data.cohortId, empId: data.empId },
            },
            update: {
                rating: data.rating,
                comments: data.comments,
            },
            create: {
                cohortId: data.cohortId,
                empId: data.empId,
                rating: data.rating,
                comments: data.comments,
            },
        });

        revalidatePath(`/admin/cohorts/${data.cohortId}`);
        return { success: true, feedback };
    } catch (error) {
        console.error('Failed to submit cohort feedback:', error);
        return { success: false, error: 'Failed to submit feedback.' };
    }
}

/**
 * Search employees for adding to a cohort.
 */
export async function searchEmployeesForCohort(query: string, cohortId?: string) {
    try {
        const employees = await db.employee.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { id: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                sectionName: true,
                designation: true,
                cohortMemberships: cohortId ? {
                    where: { cohortId },
                    select: { id: true },
                } : false,
            },
            take: 20,
        });

        return employees.map(emp => ({
            ...emp,
            isInCohort: cohortId ? (emp as any).cohortMemberships?.length > 0 : false,
        }));
    } catch (error) {
        console.error('Failed to search employees:', error);
        return [];
    }
}

/**
 * Get all programs for the cohort creation form.
 */
export async function getProgramsForCohort() {
    try {
        const programs = await db.program.findMany({
            select: {
                id: true,
                name: true,
                category: true,
            },
            orderBy: { name: 'asc' },
        });
        return programs;
    } catch (error) {
        console.error('Failed to fetch programs:', error);
        return [];
    }
}

/**
 * Delete a cohort (only if Draft).
 */
export async function deleteCohort(cohortId: string) {
    try {
        const cohort = await db.cohort.findUnique({ where: { id: cohortId } });
        if (!cohort) return { success: false, error: 'Cohort not found.' };
        if (cohort.status !== 'Draft') {
            return { success: false, error: 'Can only delete cohorts in Draft status.' };
        }

        await db.cohort.delete({ where: { id: cohortId } });

        revalidatePath('/admin/cohorts');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete cohort:', error);
        return { success: false, error: 'Failed to delete cohort.' };
    }
}
