'use server';

import { db } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export interface ManagerDirectoryItem {
    email: string;
    name: string;
    directReportsCount: number;
    department?: string;
    location?: string;
}

export interface TeamMemberTrainingSummary {
    empId: string;
    name: string;
    email: string;
    department: string;
    section: string;
    location: string;
    designation: string;
    grade: string;
    status: 'Trained' | 'Untrained';
    totalCompletedPrograms: number;
    totalTrainingHours: number;
    totalTrainingDays: number;
    latestTraining: {
        programName: string;
        date: string;
        hours: number;
        trainerName?: string;
    } | null;
    pendingNominations: Array<{
        id: string;
        programName: string;
        status: string;
        createdAt: string;
    }>;
    recentTrainings: Array<{
        id: string;
        programName: string;
        startDate: string;
        endDate?: string;
        trainingHours: number;
        trainerName?: string;
        category?: string;
    }>;
}

export interface ManagerTeamReportData {
    manager: {
        email: string;
        name: string;
        designation?: string;
        department?: string;
        location?: string;
        mobile?: string;
    };
    summary: {
        totalMembers: number;
        trainedMembers: number;
        untrainedMembers: number;
        trainingPercentage: number;
        totalProgramsCompleted: number;
        totalTrainingHours: number;
        pendingNominationsCount: number;
    };
    members: TeamMemberTrainingSummary[];
}

/**
 * Fetch list of all reporting managers with their direct report counts.
 */
export async function getManagersDirectory(): Promise<{
    managers: ManagerDirectoryItem[];
    error?: string;
}> {
    const session = await auth();
    if (!session?.user) {
        return { managers: [], error: 'Unauthorized' };
    }

    try {
        // Group all employees by managerEmail
        const rawGrouped = await db.employee.groupBy({
            by: ['managerEmail', 'managerName'],
            where: {
                managerEmail: {
                    not: null
                }
            },
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            }
        });

        // Normalize and deduplicate by lowercase manager email
        const managerMap = new Map<string, ManagerDirectoryItem>();

        for (const item of rawGrouped) {
            const email = (item.managerEmail || '').trim().toLowerCase();
            if (!email || email === 'n/a' || email === 'nil') continue;

            const existing = managerMap.get(email);
            const count = item._count.id;
            const name = (item.managerName || '').trim();

            if (existing) {
                existing.directReportsCount += count;
                if (!existing.name && name) {
                    existing.name = name;
                }
            } else {
                managerMap.set(email, {
                    email,
                    name: name || email.split('@')[0],
                    directReportsCount: count
                });
            }
        }

        const managers = Array.from(managerMap.values()).sort((a, b) => {
            return b.directReportsCount - a.directReportsCount;
        });

        return { managers };
    } catch (error) {
        console.error('Error fetching managers directory:', error);
        return { managers: [], error: 'Failed to fetch managers directory' };
    }
}

/**
 * Fetch team members and their training history under a specific manager email.
 */
export async function getManagerTeamReport(managerEmail: string): Promise<{
    data: ManagerTeamReportData | null;
    error?: string;
}> {
    const session = await auth();
    if (!session?.user) {
        return { data: null, error: 'Unauthorized' };
    }

    const trimmedEmail = (managerEmail || '').trim();
    if (!trimmedEmail) {
        return { data: null, error: 'Manager email is required' };
    }

    try {
        // Fetch manager's own employee record if available for profile details
        const managerEmp = await db.employee.findFirst({
            where: {
                email: {
                    equals: trimmedEmail,
                    mode: 'insensitive'
                }
            },
            select: {
                name: true,
                designation: true,
                department: true,
                sectionName: true,
                location: true,
                mobile: true
            }
        });

        // Fetch all direct reports under this manager
        const employees = await db.employee.findMany({
            where: {
                managerEmail: {
                    equals: trimmedEmail,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                department: true,
                sectionName: true,
                location: true,
                designation: true,
                grade: true,
                managerName: true,
                trainingHistory: {
                    select: {
                        id: true,
                        programName: true,
                        altProgramName: true,
                        progCategory: true,
                        sessionCategory: true,
                        startDate: true,
                        endDate: true,
                        trainingHours: true,
                        trainingDays: true,
                        trainerName: true
                    },
                    orderBy: {
                        startDate: 'desc'
                    }
                },
                systemTrainingHistory: {
                    select: {
                        id: true,
                        programName: true,
                        altProgramName: true,
                        progCategory: true,
                        sessionCategory: true,
                        startDate: true,
                        endDate: true,
                        trainingHours: true,
                        trainingDays: true,
                        trainerName: true
                    },
                    orderBy: {
                        startDate: 'desc'
                    }
                },
                nominations: {
                    where: {
                        status: {
                            in: ['Pending', 'Batched', 'Approved']
                        }
                    },
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        program: {
                            select: {
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        let trainedCount = 0;
        let totalProgramsAccumulator = 0;
        let totalHoursAccumulator = 0;
        let pendingNominationsAccumulator = 0;

        const members: TeamMemberTrainingSummary[] = employees.map(emp => {
            // Combine legacy and system training history, deduplicating programs by name and start date
            const seenKeys = new Set<string>();
            const combinedHistory: Array<{
                id: string;
                programName: string;
                startDate: string;
                endDate?: string;
                trainingHours: number;
                trainingDays: number;
                trainerName?: string;
                category?: string;
                sortTimestamp: number;
            }> = [];

            for (const th of [...emp.systemTrainingHistory, ...emp.trainingHistory]) {
                const progName = (th.altProgramName || th.programName || 'Training Program').trim();
                const dateStr = th.startDate ? new Date(th.startDate).toISOString().slice(0, 10) : '';
                const dedupKey = `${progName.toLowerCase()}_${dateStr}`;

                if (!seenKeys.has(dedupKey)) {
                    seenKeys.add(dedupKey);
                    const hours = th.trainingHours || 0;
                    const days = th.trainingDays || 0;
                    combinedHistory.push({
                        id: String(th.id),
                        programName: progName,
                        startDate: dateStr,
                        endDate: th.endDate ? new Date(th.endDate).toISOString().slice(0, 10) : undefined,
                        trainingHours: hours,
                        trainingDays: days,
                        trainerName: th.trainerName || undefined,
                        category: th.progCategory || th.sessionCategory || 'Training',
                        sortTimestamp: th.startDate ? new Date(th.startDate).getTime() : 0
                    });
                }
            }

            combinedHistory.sort((a, b) => b.sortTimestamp - a.sortTimestamp);

            const completedProgramsCount = combinedHistory.length;
            const employeeTotalHours = combinedHistory.reduce((sum, h) => sum + h.trainingHours, 0);
            const employeeTotalDays = combinedHistory.reduce((sum, h) => sum + h.trainingDays, 0);

            const isTrained = completedProgramsCount > 0;
            if (isTrained) trainedCount++;

            totalProgramsAccumulator += completedProgramsCount;
            totalHoursAccumulator += employeeTotalHours;

            const latest = combinedHistory.length > 0 ? {
                programName: combinedHistory[0].programName,
                date: combinedHistory[0].startDate,
                hours: combinedHistory[0].trainingHours,
                trainerName: combinedHistory[0].trainerName
            } : null;

            const pendingNoms = emp.nominations.map(n => ({
                id: n.id,
                programName: n.program?.name || 'Assigned Program',
                status: n.status,
                createdAt: n.createdAt ? new Date(n.createdAt).toISOString().slice(0, 10) : ''
            }));

            pendingNominationsAccumulator += pendingNoms.length;

            return {
                empId: emp.id,
                name: emp.name,
                email: emp.email,
                department: emp.department || emp.sectionName || 'N/A',
                section: emp.sectionName || 'N/A',
                location: emp.location || 'N/A',
                designation: emp.designation || 'Staff',
                grade: emp.grade || 'WORKMAN',
                status: isTrained ? 'Trained' : 'Untrained',
                totalCompletedPrograms: completedProgramsCount,
                totalTrainingHours: Math.round(employeeTotalHours * 10) / 10,
                totalTrainingDays: employeeTotalDays,
                latestTraining: latest,
                pendingNominations: pendingNoms,
                recentTrainings: combinedHistory.slice(0, 10)
            };
        });

        const totalMembers = employees.length;
        const untrainedCount = totalMembers - trainedCount;
        const trainingPercentage = totalMembers > 0 ? Math.round((trainedCount / totalMembers) * 100) : 0;

        // Resolve display name for the manager
        const resolvedManagerName = managerEmp?.name || (employees.length > 0 && employees[0].managerName) || trimmedEmail.split('@')[0];

        const reportData: ManagerTeamReportData = {
            manager: {
                email: trimmedEmail,
                name: resolvedManagerName,
                designation: managerEmp?.designation || undefined,
                department: managerEmp?.department || managerEmp?.sectionName || (employees[0]?.department) || undefined,
                location: managerEmp?.location || (employees[0]?.location) || undefined,
                mobile: managerEmp?.mobile || undefined
            },
            summary: {
                totalMembers,
                trainedMembers: trainedCount,
                untrainedMembers: untrainedCount,
                trainingPercentage,
                totalProgramsCompleted: totalProgramsAccumulator,
                totalTrainingHours: Math.round(totalHoursAccumulator * 10) / 10,
                pendingNominationsCount: pendingNominationsAccumulator
            },
            members
        };

        return { data: reportData };
    } catch (error) {
        console.error('Error fetching manager team report:', error);
        return { data: null, error: 'Failed to generate manager team report' };
    }
}

/**
 * Remove an employee from their manager's team by clearing manager fields in Employee master.
 */
export async function removeEmployeeFromManager(empId: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await db.employee.update({
            where: { id: empId },
            data: {
                managerEmail: null,
                managerName: null,
                managerId: null,
                managerMobile: null
            }
        });

        revalidatePath('/admin/reports/manager-team');
        revalidatePath('/trainer/manager-team');
        return { success: true };
    } catch (error: any) {
        console.error('Error removing employee from manager team:', error);
        return { success: false, error: error?.message || 'Failed to remove employee from manager team' };
    }
}

/**
 * Add an employee to a manager's team by updating manager fields in Employee master.
 */
export async function addEmployeeToManager(
    empId: string,
    managerEmail: string,
    managerName?: string,
    managerId?: string,
    managerMobile?: string
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }

    const trimmedEmail = (managerEmail || '').trim();
    if (!trimmedEmail) {
        return { success: false, error: 'Manager email is required' };
    }

    try {
        // Resolve manager name/id/mobile if not provided
        let resolvedName = managerName;
        let resolvedId = managerId;
        let resolvedMobile = managerMobile;

        if (!resolvedName) {
            const managerEmp = await db.employee.findFirst({
                where: { email: { equals: trimmedEmail, mode: 'insensitive' } },
                select: { name: true, id: true, mobile: true }
            });
            if (managerEmp) {
                resolvedName = managerEmp.name;
                resolvedId = managerEmp.id;
                resolvedMobile = managerEmp.mobile || undefined;
            } else {
                resolvedName = trimmedEmail.split('@')[0];
            }
        }

        await db.employee.update({
            where: { id: empId },
            data: {
                managerEmail: trimmedEmail,
                managerName: resolvedName || null,
                managerId: resolvedId || null,
                managerMobile: resolvedMobile || null
            }
        });

        revalidatePath('/admin/reports/manager-team');
        revalidatePath('/trainer/manager-team');
        return { success: true };
    } catch (error: any) {
        console.error('Error adding employee to manager team:', error);
        return { success: false, error: error?.message || 'Failed to add employee to manager team' };
    }
}

export interface EmployeeSearchCandidate {
    id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    location: string;
    currentManagerName?: string;
    currentManagerEmail?: string;
}

/**
 * Search employees across the company who can be added to this manager's team.
 */
export async function searchEmployeesToAdd(
    query: string,
    excludeManagerEmail: string
): Promise<{ candidates: EmployeeSearchCandidate[]; error?: string }> {
    const session = await auth();
    if (!session?.user) {
        return { candidates: [], error: 'Unauthorized' };
    }

    const q = (query || '').trim();
    if (!q || q.length < 2) {
        return { candidates: [] };
    }

    try {
        const employees = await db.employee.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { id: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } }
                ],
                NOT: {
                    managerEmail: { equals: excludeManagerEmail.trim(), mode: 'insensitive' }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                department: true,
                sectionName: true,
                designation: true,
                location: true,
                managerName: true,
                managerEmail: true
            },
            take: 20,
            orderBy: { name: 'asc' }
        });

        const candidates: EmployeeSearchCandidate[] = employees.map(e => ({
            id: e.id,
            name: e.name,
            email: e.email,
            department: e.department || e.sectionName || 'N/A',
            designation: e.designation || 'Staff',
            location: e.location || 'N/A',
            currentManagerName: e.managerName || undefined,
            currentManagerEmail: e.managerEmail || undefined
        }));

        return { candidates };
    } catch (error) {
        console.error('Error searching employees to add:', error);
        return { candidates: [], error: 'Failed to search employees' };
    }
}

