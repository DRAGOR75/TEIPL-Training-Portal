'use server';

import { db } from '@/lib/prisma';
import { auth } from '@/auth';

export interface WorkforceEmployeeRecord {
    empId: string;
    name: string;
    email: string;
    department: string;
    section: string;
    departmentGroup: string;
    location: string;
    projectLocation: string;
    onRollContract: string;
    designation: string;
    grade: string;
    gender: string;
    employeeGroupMNmw: string;
    organization: string;
    region: string;
    highestQualification: string;
    managerName: string;
    managerEmail: string;
    status: 'Trained' | 'Untrained';
    programsCompleted: number;
    trainingHours: number;
    trainingDays: number;
    latestProgram: {
        name: string;
        date: string;
        hours: number;
        trainer?: string;
    } | null;
    pendingTNICount: number;
    pendingTNIs: Array<{
        id: string;
        programName: string;
        status: string;
    }>;
    trainings: Array<{
        programName: string;
        date: string;
        hours: number;
        category?: string;
        trainer?: string;
    }>;
}

export interface DeficitBreakdownItem {
    name: string;
    total: number;
    trained: number;
    untrained: number;
    untrainedPercentage: number;
    totalHours: number;
    pendingTNIs: number;
}

export interface WorkforceTrainingAnalyticsData {
    summary: {
        totalEmployees: number;
        trainedEmployees: number;
        untrainedEmployees: number;
        trainedPercentage: number;
        untrainedPercentage: number;
        totalTrainingHours: number;
        totalProgramsDelivered: number;
        totalPendingTNIs: number;
    };
    employees: WorkforceEmployeeRecord[];
    sectionBreakdown: DeficitBreakdownItem[];
    departmentGroupBreakdown: DeficitBreakdownItem[];
    locationBreakdown: DeficitBreakdownItem[];
    filterOptions: {
        locations: string[];
        projectLocations: string[];
        departmentGroups: string[];
        sections: string[];
        departments: string[];
        onRollContract: string[];
        grades: string[];
        genders: string[];
        employeeGroups: string[];
        organizations: string[];
        regions: string[];
        highestQualifications: string[];
        managers: string[];
        financialYears: string[];
    };
}

/**
 * Fetch unified workforce training analytics data with complete employee master and training histories.
 */
export async function getWorkforceTrainingAnalyticsData(): Promise<{
    data: WorkforceTrainingAnalyticsData | null;
    error?: string;
}> {
    const session = await auth();
    if (!session?.user) {
        return { data: null, error: 'Unauthorized' };
    }

    try {
        // 1. Fetch all employees with master fields
        const allEmployees = await db.employee.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                department: true,
                sectionName: true,
                departmentGroup: true,
                location: true,
                projectLocation: true,
                onRollContract: true,
                designation: true,
                grade: true,
                gender: true,
                employeeGrouupMNmw: true,
                organization: true,
                region: true,
                highestQualification: true,
                managerName: true,
                managerEmail: true,
                status: true
            },
            orderBy: { name: 'asc' }
        });

        // 2. Fetch all completed training records from both legacy and system history tables
        const [legacyHistory, systemHistory, nominations] = await Promise.all([
            db.trainingHistory.findMany({
                select: {
                    empId: true,
                    programName: true,
                    altProgramName: true,
                    startDate: true,
                    trainingHours: true,
                    trainingDays: true,
                    trainerName: true,
                    progCategory: true,
                    sessionCategory: true,
                    year: true
                },
                orderBy: { startDate: 'desc' }
            }),
            db.systemTrainingHistory.findMany({
                select: {
                    empId: true,
                    programName: true,
                    altProgramName: true,
                    startDate: true,
                    trainingHours: true,
                    trainingDays: true,
                    trainerName: true,
                    progCategory: true,
                    sessionCategory: true,
                    year: true
                },
                orderBy: { startDate: 'desc' }
            }),
            db.nomination.findMany({
                where: {
                    status: { in: ['Pending', 'Batched', 'Approved'] }
                },
                select: {
                    id: true,
                    empId: true,
                    status: true,
                    program: {
                        select: { name: true }
                    }
                }
            })
        ]);

        // Map training records per employee
        const trainingMap = new Map<string, Array<{
            programName: string;
            date: string;
            hours: number;
            days: number;
            trainer?: string;
            category?: string;
            year?: string;
            timestamp: number;
        }>>();

        const availableFYsSet = new Set<string>();

        for (const th of [...systemHistory, ...legacyHistory]) {
            if (!th.empId) continue;
            const empId = th.empId.trim();
            if (th.year && th.year.trim()) availableFYsSet.add(th.year.trim());

            const dateStr = th.startDate ? new Date(th.startDate).toISOString().slice(0, 10) : '';
            const prog = (th.altProgramName || th.programName || 'Training Program').trim();
            const hours = th.trainingHours || 0;
            const days = th.trainingDays || 0;

            const existing = trainingMap.get(empId) || [];
            // Deduplicate same course on same date
            const isDup = existing.some(e => e.programName.toLowerCase() === prog.toLowerCase() && e.date === dateStr);
            if (!isDup) {
                existing.push({
                    programName: prog,
                    date: dateStr,
                    hours,
                    days,
                    trainer: th.trainerName || undefined,
                    category: th.progCategory || th.sessionCategory || 'Training',
                    year: th.year || undefined,
                    timestamp: th.startDate ? new Date(th.startDate).getTime() : 0
                });
                trainingMap.set(empId, existing);
            }
        }

        // Map pending nominations per employee
        const nominationsMap = new Map<string, Array<{ id: string; programName: string; status: string }>>();
        for (const nom of nominations) {
            if (!nom.empId) continue;
            const existing = nominationsMap.get(nom.empId) || [];
            existing.push({
                id: nom.id,
                programName: nom.program?.name || 'Nominated Course',
                status: nom.status
            });
            nominationsMap.set(nom.empId, existing);
        }

        // Sets for distinct filter options
        const locationsSet = new Set<string>();
        const projectLocationsSet = new Set<string>();
        const deptGroupsSet = new Set<string>();
        const sectionsSet = new Set<string>();
        const departmentsSet = new Set<string>();
        const onRollContractSet = new Set<string>();
        const gradesSet = new Set<string>();
        const gendersSet = new Set<string>();
        const employeeGroupsSet = new Set<string>();
        const organizationsSet = new Set<string>();
        const regionsSet = new Set<string>();
        const qualificationsSet = new Set<string>();
        const managersSet = new Set<string>();

        let totalTrainedAccumulator = 0;
        let totalHoursAccumulator = 0;
        let totalProgramsAccumulator = 0;
        let totalPendingTNIsAccumulator = 0;

        // Build Master Employee Records
        const employees: WorkforceEmployeeRecord[] = allEmployees.map(emp => {
            const empId = emp.id.trim();

            // Populate filter sets
            if (emp.location?.trim()) locationsSet.add(emp.location.trim());
            if (emp.projectLocation?.trim()) projectLocationsSet.add(emp.projectLocation.trim());
            if (emp.departmentGroup?.trim()) deptGroupsSet.add(emp.departmentGroup.trim());
            if (emp.sectionName?.trim()) sectionsSet.add(emp.sectionName.trim());
            if (emp.department?.trim()) departmentsSet.add(emp.department.trim());
            if (emp.onRollContract?.trim()) onRollContractSet.add(emp.onRollContract.trim());
            if (emp.grade?.trim()) gradesSet.add(emp.grade.trim());
            if (emp.gender?.trim()) gendersSet.add(emp.gender.trim());
            if (emp.employeeGrouupMNmw?.trim()) employeeGroupsSet.add(emp.employeeGrouupMNmw.trim());
            if (emp.organization?.trim()) organizationsSet.add(emp.organization.trim());
            if (emp.region?.trim()) regionsSet.add(emp.region.trim());
            if (emp.highestQualification?.trim()) qualificationsSet.add(emp.highestQualification.trim());
            if (emp.managerName?.trim()) managersSet.add(emp.managerName.trim());

            const userTrainings = trainingMap.get(empId) || [];
            userTrainings.sort((a, b) => b.timestamp - a.timestamp);

            const userNoms = nominationsMap.get(empId) || [];
            totalPendingTNIsAccumulator += userNoms.length;

            const programsCompleted = userTrainings.length;
            const trainingHours = Math.round(userTrainings.reduce((sum, t) => sum + t.hours, 0) * 10) / 10;
            const trainingDays = userTrainings.reduce((sum, t) => sum + t.days, 0);

            const isTrained = programsCompleted > 0;
            if (isTrained) totalTrainedAccumulator++;
            totalHoursAccumulator += trainingHours;
            totalProgramsAccumulator += programsCompleted;

            const latest = userTrainings.length > 0 ? {
                name: userTrainings[0].programName,
                date: userTrainings[0].date,
                hours: userTrainings[0].hours,
                trainer: userTrainings[0].trainer
            } : null;

            return {
                empId,
                name: emp.name || 'Unknown',
                email: emp.email || 'N/A',
                department: emp.department || emp.sectionName || 'Unassigned',
                section: emp.sectionName || emp.department || 'Unassigned',
                departmentGroup: emp.departmentGroup || 'General',
                location: emp.location || 'Unassigned',
                projectLocation: emp.projectLocation || 'Unassigned',
                onRollContract: emp.onRollContract || 'Regular',
                designation: emp.designation || 'Staff',
                grade: emp.grade || 'WORKMAN',
                gender: emp.gender || 'N/A',
                employeeGroupMNmw: emp.employeeGrouupMNmw || 'N/A',
                organization: emp.organization || 'Thriveni',
                region: emp.region || 'N/A',
                highestQualification: emp.highestQualification || 'N/A',
                managerName: emp.managerName || 'Unassigned',
                managerEmail: emp.managerEmail || 'N/A',
                status: isTrained ? 'Trained' : 'Untrained',
                programsCompleted,
                trainingHours,
                trainingDays,
                latestProgram: latest,
                pendingTNICount: userNoms.length,
                pendingTNIs: userNoms,
                trainings: userTrainings.map(t => ({
                    programName: t.programName,
                    date: t.date,
                    hours: t.hours,
                    category: t.category,
                    trainer: t.trainer
                }))
            };
        });

        const totalEmployees = employees.length;
        const totalUntrained = totalEmployees - totalTrainedAccumulator;
        const trainedPercentage = totalEmployees > 0 ? Math.round((totalTrainedAccumulator / totalEmployees) * 100) : 0;
        const untrainedPercentage = totalEmployees > 0 ? Math.round((totalUntrained / totalEmployees) * 100) : 0;

        // Helper to calculate breakdowns
        const buildBreakdown = (key: keyof WorkforceEmployeeRecord): DeficitBreakdownItem[] => {
            const map = new Map<string, { total: number; trained: number; hours: number; pending: number }>();

            for (const e of employees) {
                const groupName = String(e[key] || 'Unassigned').trim();
                const curr = map.get(groupName) || { total: 0, trained: 0, hours: 0, pending: 0 };
                curr.total++;
                if (e.status === 'Trained') curr.trained++;
                curr.hours += e.trainingHours;
                curr.pending += e.pendingTNICount;
                map.set(groupName, curr);
            }

            return Array.from(map.entries())
                .map(([name, val]) => {
                    const untrained = val.total - val.trained;
                    const untrainedPercentage = val.total > 0 ? Math.round((untrained / val.total) * 100) : 0;
                    return {
                        name,
                        total: val.total,
                        trained: val.trained,
                        untrained,
                        untrainedPercentage,
                        totalHours: Math.round(val.hours * 10) / 10,
                        pendingTNIs: val.pending
                    };
                })
                .sort((a, b) => b.untrained - a.untrained); // Show highest deficit first
        };

        const sectionBreakdown = buildBreakdown('section');
        const departmentGroupBreakdown = buildBreakdown('departmentGroup');
        const locationBreakdown = buildBreakdown('location');

        const sortList = (set: Set<string>) => Array.from(set).filter(Boolean).sort();

        const data: WorkforceTrainingAnalyticsData = {
            summary: {
                totalEmployees,
                trainedEmployees: totalTrainedAccumulator,
                untrainedEmployees: totalUntrained,
                trainedPercentage,
                untrainedPercentage,
                totalTrainingHours: Math.round(totalHoursAccumulator * 10) / 10,
                totalProgramsDelivered: totalProgramsAccumulator,
                totalPendingTNIs: totalPendingTNIsAccumulator
            },
            employees,
            sectionBreakdown,
            departmentGroupBreakdown,
            locationBreakdown,
            filterOptions: {
                locations: sortList(locationsSet),
                projectLocations: sortList(projectLocationsSet),
                departmentGroups: sortList(deptGroupsSet),
                sections: sortList(sectionsSet),
                departments: sortList(departmentsSet),
                onRollContract: sortList(onRollContractSet),
                grades: sortList(gradesSet),
                genders: sortList(gendersSet),
                employeeGroups: sortList(employeeGroupsSet),
                organizations: sortList(organizationsSet),
                regions: sortList(regionsSet),
                highestQualifications: sortList(qualificationsSet),
                managers: sortList(managersSet),
                financialYears: sortList(availableFYsSet)
            }
        };

        return { data };
    } catch (error) {
        console.error('Error generating workforce training analytics:', error);
        return { data: null, error: 'Failed to generate workforce training analytics' };
    }
}
