'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getFinancialYear, parseFlexibleDate } from '@/lib/date-utils';

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
    id?: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    duration?: number;
    totalParticipants?: number;
    cohortGroup?: string;
    cohortYear?: string;
    programs: { id: string; sessionId?: string }[];
}) {
    try {
        const computedYear = data.cohortYear || (data.startDate ? getFinancialYear(data.startDate) : undefined);

        const cohort = await db.cohort.create({
            data: {
                ...(data.id?.trim() ? { id: data.id.trim() } : {}),
                name: data.name,
                description: data.description,
                cohortStartDate: data.startDate ? new Date(data.startDate) : undefined,
                cohortEndDate: data.endDate ? new Date(data.endDate) : undefined,
                cohortRegion: data.location,
                cohortDuration: data.duration,
                totalParticipants: data.totalParticipants ? parseInt(data.totalParticipants.toString(), 10) : undefined,
                cohortGroup: data.cohortGroup?.trim() || undefined,
                cohortYear: computedYear || undefined,
            },
        });

        // Create cohort programs
        for (let i = 0; i < data.programs.length; i++) {
            const p = data.programs[i];
            let status = 'Pending';
            if (p.sessionId) {
                const session = await db.trainingSession.findUnique({ where: { id: p.sessionId } });
                if (session && session.status === 'Completed') {
                    status = 'Completed';
                } else if (session) {
                    status = 'InProgress';
                }
            }

            await db.cohortProgram.create({
                data: {
                    cohortId: cohort.id,
                    programId: p.id,
                    seq: i + 1,
                    sessionId: p.sessionId || null,
                    status: status,
                }
            });
        }

        // Check if we should update cohort status based on linked sessions
        const allPrograms = await db.cohortProgram.findMany({ where: { cohortId: cohort.id } });
        if (allPrograms.length > 0 && allPrograms.every(cp => cp.status === 'Completed')) {
            await db.cohort.update({
                where: { id: cohort.id },
                data: { status: 'Completed' }
            });
        } else if (allPrograms.some(cp => cp.sessionId)) {
            await db.cohort.update({
                where: { id: cohort.id },
                data: { status: 'Active' }
            });
        }

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
    startDate?: string;
    endDate?: string;
    location?: string;
    duration?: number;
    totalParticipants?: number;
    cohortGroup?: string;
    cohortYear?: string;
    programs?: { id: string; sessionId?: string }[];
}) {
    try {
        const computedYear = data.cohortYear !== undefined
            ? data.cohortYear
            : (data.startDate ? getFinancialYear(data.startDate) : undefined);

        const cohort = await db.cohort.update({
            where: { id: cohortId },
            data: {
                name: data.name,
                description: data.description,
                status: data.status,
                cohortStartDate: data.startDate ? new Date(data.startDate) : undefined,
                cohortEndDate: data.endDate ? new Date(data.endDate) : undefined,
                cohortRegion: data.location,
                cohortDuration: data.duration,
                totalParticipants: data.totalParticipants,
                cohortGroup: data.cohortGroup !== undefined ? (data.cohortGroup?.trim() || null) : undefined,
                cohortYear: computedYear,
            },
        });

        // If programs array is provided, rewrite the program sequence
        if (data.programs) {
            // Delete all existing programs for this cohort
            await db.cohortProgram.deleteMany({
                where: { cohortId: cohortId }
            });

            // Recreate them with new sequence and links
            for (let i = 0; i < data.programs.length; i++) {
                const p = data.programs[i];
                let status = 'Pending';
                if (p.sessionId) {
                    const session = await db.trainingSession.findUnique({ where: { id: p.sessionId } });
                    if (session && session.status === 'Completed') {
                        status = 'Completed';
                    } else if (session) {
                        status = 'InProgress';
                    }
                }

                await db.cohortProgram.create({
                    data: {
                        cohortId: cohort.id,
                        programId: p.id,
                        seq: i + 1,
                        sessionId: p.sessionId || null,
                        status: status,
                    }
                });
            }
        }

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
        revalidateTag('tni-reports', 'max');

        return { success: true, sessionId: session.id, batchId: batch.id };
    } catch (error) {
        console.error('Failed to schedule cohort session:', error);
        return { success: false, error: 'Failed to schedule session.' };
    }
}

/**
 * Link an existing session to a CohortProgram.
 */
export async function linkExistingSessionToCohortProgram(cohortProgramId: string, sessionId: string) {
    try {
        const cohortProgram = await db.cohortProgram.findUnique({
            where: { id: cohortProgramId },
            include: { cohort: true },
        });

        if (!cohortProgram) {
            return { success: false, error: 'Cohort program not found.' };
        }

        if (cohortProgram.sessionId) {
            return { success: false, error: 'A session is already scheduled for this program.' };
        }

        const session = await db.trainingSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return { success: false, error: 'Session not found.' };
        }

        // Link session and set status based on session status
        const status = session.status === 'Completed' ? 'Completed' : 'InProgress';

        await db.cohortProgram.update({
            where: { id: cohortProgramId },
            data: {
                sessionId: session.id,
                status: status,
            },
        });

        // Activate cohort if still Draft
        if (cohortProgram.cohort.status === 'Draft') {
            await db.cohort.update({
                where: { id: cohortProgram.cohortId },
                data: { status: 'Active' },
            });
        }

        // If the session was already completed, we might have completed the entire cohort
        if (status === 'Completed') {
            await markCohortProgramComplete(cohortProgramId); // reuse the existing logic to check for full cohort completion
        }

        revalidatePath(`/admin/cohorts/${cohortProgram.cohortId}`);
        revalidatePath('/admin/sessions');

        return { success: true };
    } catch (error) {
        console.error('Failed to link existing session:', error);
        return { success: false, error: 'Failed to link session.' };
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
 * Get available existing training sessions for a specific program name.
 * Only returns sessions that are NOT already linked to a cohort program.
 */
export async function getAvailableSessionsForProgram(programName: string) {
    try {
        const sessions = await db.trainingSession.findMany({
            where: {
                programName: programName,
                cohortProgram: null, // Ensure it's not already linked
            },
            orderBy: {
                startDate: 'desc',
            },
        });
        return sessions;
    } catch (error) {
        console.error('Failed to get available sessions:', error);
        return [];
    }
}

/**
 * Get all available existing training sessions across all programs.
 * Only returns active/scheduled sessions that are NOT already linked to a cohort program.
 */
export async function getAllAvailableSessionsForCohort() {
    try {
        const sessions = await db.trainingSession.findMany({
            where: {
                cohortProgram: null, // Ensure it's not already linked
            },
            orderBy: {
                startDate: 'desc',
            },
            take: 50, // Limit to recent 50 to avoid huge payloads
        });
        return sessions;
    } catch (error) {
        console.error('Failed to get all available sessions:', error);
        return [];
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

/**
 * Fetch all enrollments (which contain feedbacks) for all sessions in a cohort
 */
export async function exportCohortProgramFeedbacks(cohortId: string) {
    try {
        const cohortPrograms = await db.cohortProgram.findMany({
            where: { cohortId },
            include: {
                program: { select: { name: true } },
                session: {
                    include: {
                        enrollments: {
                            where: { status: 'Completed' } // Only get completed enrollments
                        }
                    }
                }
            }
        });

        // Flatten all enrollments into a single array
        const allFeedbacks = [];
        
        for (const cp of cohortPrograms) {
            if (cp.session && cp.session.enrollments.length > 0) {
                for (const enrollment of cp.session.enrollments) {
                    allFeedbacks.push({
                        'Program Name': cp.program.name,
                        'Trainer': cp.session.trainerName || 'N/A',
                        'Employee Name': enrollment.employeeName,
                        'Employee ID': enrollment.empId || 'N/A',
                        'Status': enrollment.status,
                        'Pre-Training Rating': enrollment.preTrainingRating || 'N/A',
                        'Post-Training Rating': enrollment.postTrainingRating || 'N/A',
                        'Trainer Rating': enrollment.trainerRating || 'N/A',
                        'Content Rating': enrollment.contentRating || 'N/A',
                        'Material Rating': enrollment.materialRating || 'N/A',
                        'Topics Learned': enrollment.topicsLearned || 'N/A',
                        'Action Plan': enrollment.actionPlan || 'N/A',
                        'Suggestions': enrollment.suggestions || 'N/A',
                        'Average Rating': enrollment.averageRating || 'N/A'
                    });
                }
            }
        }

        return { success: true, data: allFeedbacks };
    } catch (error) {
        console.error('Failed to export cohort feedbacks:', error);
        return { success: false, error: 'Failed to export feedbacks.' };
    }
}

export interface BulkCohortRow {
    cohortId?: string;
    status?: string;
    cohortName: string;
    cohortGroup?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    cohortYear?: string;
    location?: string;
    totalParticipants?: number;
    duration?: number;
    programName?: string;
    programId?: string;
    sessionId?: string;
    seq?: number;
}

/**
 * Bulk upload cohorts and their programs, with session linking capability.
 */
export async function bulkUploadCohorts(rows: BulkCohortRow[]) {
    try {
        if (!rows || rows.length === 0) {
            return { success: false, error: 'No data rows provided.' };
        }

        // Fetch all programs from master catalog
        const allPrograms = await db.program.findMany({
            select: { id: true, name: true, category: true }
        });
        const programMap = new Map<string, { id: string; name: string }>();
        allPrograms.forEach(p => {
            programMap.set(p.name.trim().toLowerCase(), { id: p.id, name: p.name });
            programMap.set(p.id.toLowerCase(), { id: p.id, name: p.name });
        });

        // Collect all session IDs from rows
        const rawSessionIds = rows
            .map(r => r.sessionId?.trim())
            .filter((id): id is string => Boolean(id && id.length > 0));

        // Fetch all mentioned sessions
        const foundSessions = rawSessionIds.length > 0
            ? await db.trainingSession.findMany({
                where: { id: { in: rawSessionIds } },
                include: { cohortProgram: true }
            })
            : [];
        const sessionMap = new Map<string, any>();
        foundSessions.forEach(s => sessionMap.set(s.id, s));

        // Group rows by Cohort ID or Cohort Name
        const cohortsMap = new Map<string, {
            id?: string;
            status?: string;
            name: string;
            cohortGroup?: string;
            description?: string;
            startDate?: string;
            endDate?: string;
            cohortYear?: string;
            location?: string;
            totalParticipants?: number;
            duration?: number;
            programs: Array<{
                programName?: string;
                programId?: string;
                sessionId?: string;
                seq?: number;
            }>;
        }>();

        const idToKey = new Map<string, string>();
        const nameToKey = new Map<string, string>();

        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 1;
            const cohortId = row.cohortId?.trim();
            const cohortName = row.cohortName?.trim();

            if (!cohortName && !cohortId) {
                errors.push(`Row ${rowNum}: Missing "Cohort Name" or "Cohort ID".`);
                continue;
            }

            const effectiveName = cohortName || cohortId!;

            // Check session ID validity if provided
            if (row.sessionId?.trim()) {
                const sId = row.sessionId.trim();
                const session = sessionMap.get(sId);
                if (!session) {
                    errors.push(`Row ${rowNum} (${effectiveName}): Session ID "${sId}" was not found in database.`);
                } else if (session.cohortProgram) {
                    // Check if already linked to a different cohort
                    const existingCohort = await db.cohort.findUnique({
                        where: { id: session.cohortProgram.cohortId },
                        select: { id: true, name: true }
                    });
                    const isSameCohort = (cohortId && session.cohortProgram.cohortId === cohortId) ||
                        (existingCohort && cohortName && existingCohort.name.toLowerCase() === cohortName.toLowerCase());

                    if (!isSameCohort) {
                        errors.push(`Row ${rowNum} (${effectiveName}): Session ID "${sId}" is already linked to cohort "${existingCohort?.name || session.cohortProgram.cohortId}".`);
                    }
                }
            }

            // Find existing group key
            let groupKey: string | undefined;
            if (cohortId && idToKey.has(cohortId.toLowerCase())) {
                groupKey = idToKey.get(cohortId.toLowerCase());
            } else if (cohortName && nameToKey.has(cohortName.toLowerCase())) {
                groupKey = nameToKey.get(cohortName.toLowerCase());
            }

            const parsedStartDate = parseFlexibleDate(row.startDate) || row.startDate?.trim() || undefined;
            const parsedEndDate = parseFlexibleDate(row.endDate) || row.endDate?.trim() || undefined;

            if (!groupKey) {
                groupKey = cohortId ? `id:${cohortId.toLowerCase()}` : `name:${cohortName!.toLowerCase()}`;
                if (cohortId) idToKey.set(cohortId.toLowerCase(), groupKey);
                if (cohortName) nameToKey.set(cohortName.toLowerCase(), groupKey);

                cohortsMap.set(groupKey, {
                    id: cohortId || undefined,
                    status: row.status?.trim() || undefined,
                    name: effectiveName,
                    cohortGroup: row.cohortGroup?.trim() || undefined,
                    description: row.description?.trim() || undefined,
                    startDate: parsedStartDate,
                    endDate: parsedEndDate,
                    cohortYear: row.cohortYear?.trim() || undefined,
                    location: row.location?.trim() || undefined,
                    totalParticipants: row.totalParticipants ? Number(row.totalParticipants) : undefined,
                    duration: row.duration ? Number(row.duration) : undefined,
                    programs: [],
                });
            }

            const c = cohortsMap.get(groupKey)!;
            if (cohortId && !c.id) {
                c.id = cohortId;
                idToKey.set(cohortId.toLowerCase(), groupKey);
            }
            if (cohortName && (!c.name || c.name === c.id)) {
                c.name = cohortName;
                nameToKey.set(cohortName.toLowerCase(), groupKey);
            }

            // Overwrite missing metadata if present on subsequent rows
            if (!c.status && row.status?.trim()) c.status = row.status.trim();
            if (!c.cohortGroup && row.cohortGroup?.trim()) c.cohortGroup = row.cohortGroup.trim();
            if (!c.description && row.description?.trim()) c.description = row.description.trim();
            if (!c.startDate && parsedStartDate) c.startDate = parsedStartDate;
            if (!c.endDate && parsedEndDate) c.endDate = parsedEndDate;
            if (!c.cohortYear && row.cohortYear?.trim()) c.cohortYear = row.cohortYear.trim();
            if (!c.location && row.location?.trim()) c.location = row.location.trim();
            if (!c.totalParticipants && row.totalParticipants) c.totalParticipants = Number(row.totalParticipants);
            if (!c.duration && row.duration) c.duration = Number(row.duration);

            // If row has program info or session info, record program
            if (row.programName || row.programId || row.sessionId) {
                c.programs.push({
                    programName: row.programName?.trim(),
                    programId: row.programId?.trim(),
                    sessionId: row.sessionId?.trim() || undefined,
                    seq: row.seq ? Number(row.seq) : undefined,
                });
            }
        }

        let createdCount = 0;
        let updatedCount = 0;
        let programsCount = 0;
        let linkedSessionsCount = 0;

        for (const [_, cohortData] of cohortsMap.entries()) {
            const computedYear = cohortData.cohortYear || (cohortData.startDate ? getFinancialYear(cohortData.startDate) : undefined);

            // Find or create cohort: check by ID first, then by Name
            let cohort: any = null;
            if (cohortData.id) {
                cohort = await db.cohort.findUnique({
                    where: { id: cohortData.id },
                });
            }
            if (!cohort && cohortData.name) {
                cohort = await db.cohort.findFirst({
                    where: { name: { equals: cohortData.name, mode: 'insensitive' } },
                });
            }

            if (!cohort) {
                cohort = await db.cohort.create({
                    data: {
                        ...(cohortData.id ? { id: cohortData.id } : {}),
                        name: cohortData.name,
                        description: cohortData.description,
                        cohortStartDate: cohortData.startDate ? new Date(cohortData.startDate) : undefined,
                        cohortEndDate: cohortData.endDate ? new Date(cohortData.endDate) : undefined,
                        cohortYear: computedYear,
                        cohortGroup: cohortData.cohortGroup,
                        cohortRegion: cohortData.location,
                        cohortDuration: cohortData.duration,
                        totalParticipants: cohortData.totalParticipants,
                        status: cohortData.status || 'Draft',
                    }
                });
                createdCount++;
            } else {
                // Update metadata
                cohort = await db.cohort.update({
                    where: { id: cohort.id },
                    data: {
                        name: cohortData.name ?? cohort.name,
                        description: cohortData.description ?? cohort.description,
                        cohortStartDate: cohortData.startDate ? new Date(cohortData.startDate) : cohort.cohortStartDate,
                        cohortEndDate: cohortData.endDate ? new Date(cohortData.endDate) : cohort.cohortEndDate,
                        cohortYear: computedYear ?? cohort.cohortYear,
                        cohortGroup: cohortData.cohortGroup ?? cohort.cohortGroup,
                        cohortRegion: cohortData.location ?? cohort.cohortRegion,
                        cohortDuration: cohortData.duration ?? cohort.cohortDuration,
                        totalParticipants: cohortData.totalParticipants ?? cohort.totalParticipants,
                        status: cohortData.status ?? cohort.status,
                    }
                });
                updatedCount++;
            }

            // Existing programs for this cohort
            const existingCPs = await db.cohortProgram.findMany({
                where: { cohortId: cohort.id },
            });
            let nextSeq = existingCPs.length > 0 ? Math.max(...existingCPs.map(cp => cp.seq)) + 1 : 1;

            // Process programs
            for (const progData of cohortData.programs) {
                let resolvedProgramId: string | null = null;
                let linkedSession: any = null;

                // If sessionId is provided, try to resolve program from session
                if (progData.sessionId) {
                    linkedSession = sessionMap.get(progData.sessionId);
                    if (linkedSession) {
                        const matched = programMap.get(linkedSession.programName.trim().toLowerCase());
                        if (matched) {
                            resolvedProgramId = matched.id;
                        }
                    }
                }

                // If programId or programName was explicitly provided, try to resolve that
                if (!resolvedProgramId && progData.programId) {
                    const matched = programMap.get(progData.programId.trim().toLowerCase());
                    if (matched) resolvedProgramId = matched.id;
                }
                if (!resolvedProgramId && progData.programName) {
                    const matched = programMap.get(progData.programName.trim().toLowerCase());
                    if (matched) resolvedProgramId = matched.id;
                }

                if (!resolvedProgramId) {
                    errors.push(`Cohort "${cohort.name}": Could not find program in catalog for entry with program "${progData.programName || progData.programId || 'Unknown'}" or session "${progData.sessionId || ''}".`);
                    continue;
                }

                // Check if this program is already in the cohort
                const existingProg = await db.cohortProgram.findFirst({
                    where: {
                        cohortId: cohort.id,
                        programId: resolvedProgramId,
                    }
                });

                let cpStatus = 'Pending';
                if (linkedSession) {
                    cpStatus = linkedSession.status === 'Completed' ? 'Completed' : 'InProgress';
                }

                if (existingProg) {
                    // Update existing program if a new session link is provided
                    if (linkedSession && existingProg.sessionId !== linkedSession.id) {
                        await db.cohortProgram.update({
                            where: { id: existingProg.id },
                            data: {
                                sessionId: linkedSession.id,
                                status: cpStatus,
                            }
                        });
                        linkedSessionsCount++;
                    }
                } else {
                    // Create new cohort program
                    await db.cohortProgram.create({
                        data: {
                            cohortId: cohort.id,
                            programId: resolvedProgramId,
                            seq: progData.seq || nextSeq++,
                            sessionId: linkedSession ? linkedSession.id : null,
                            status: cpStatus,
                        }
                    });
                    programsCount++;
                    if (linkedSession) linkedSessionsCount++;
                }
            }

            // Refresh cohort status based on all its programs
            const allCohortProgs = await db.cohortProgram.findMany({ where: { cohortId: cohort.id } });
            if (allCohortProgs.length > 0 && allCohortProgs.every(cp => cp.status === 'Completed')) {
                await db.cohort.update({
                    where: { id: cohort.id },
                    data: { status: 'Completed' }
                });
            } else if (allCohortProgs.some(cp => cp.sessionId)) {
                await db.cohort.update({
                    where: { id: cohort.id },
                    data: { status: 'Active' }
                });
            }
        }

        revalidatePath('/admin/cohorts');
        revalidatePath('/admin/sessions');

        return {
            success: true,
            createdCount,
            updatedCount,
            programsCount,
            linkedSessionsCount,
            errors,
        };
    } catch (error: any) {
        console.error('Failed to bulk upload cohorts:', error);
        return { success: false, error: error.message || 'Failed to bulk upload cohorts.' };
    }
}

