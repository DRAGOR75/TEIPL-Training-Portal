'use server';

import { db } from '@/lib/prisma';
import { auth } from '@/auth';
import { getFinancialYear, getFinancialYearDateRange } from '@/lib/date-utils';

export interface TrainerReportStats {
    trainerName: string;
    isAllTrainers: boolean;
    selectedFinancialYear: string;
    pipeline: {
        totalSessions: number;
        completedSessions: number;
        scheduledSessions: number;
        formingSessions: number;
        cancelledSessions: number;
        completionRate: number; // percentage
    };
    output: {
        totalTrainingHours: number;
        totalTrainingDays: number;
        totalTraineeSessions: number;
        uniquePersonsTrained: number;
        totalPrograms: number;
    };
    firstTimers: {
        totalFirstTimers: number;
        firstTimerPercentage: number;
        refresherCount: number;
        firstTimersRoster: Array<{
            empId: string;
            name: string;
            department: string;
            section: string;
            location: string;
            grade: string;
            programName: string;
            date: string;
            hours: number;
        }>;
    };
    quality: {
        averageRating: number | null;
        totalRatingsCount: number;
        recommendationRate: number | null; // percentage
        recentFeedback: Array<{
            empName: string;
            programName: string;
            rating: number | null;
            topicsLearned: string | null;
            actionPlan: string | null;
            suggestions: string | null;
            date: string;
        }>;
    };
    programBreakdown: Array<{
        name: string;
        sessionsCount: number;
        totalHours: number;
        personsTrained: number;
    }>;
    departmentBreakdown: Array<{
        name: string;
        count: number;
        firstTimers: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        sessions: number;
        trainees: number;
        firstTimers: number;
    }>;
    recentSessions: Array<{
        id: string;
        programName: string;
        status: string;
        startDate: string;
        endDate: string;
        trainingHours: number;
        trainingDays: number;
        location: string;
        enrolledCount: number;
        attendedCount: number;
    }>;
}

export interface TrainerComparisonItem {
    trainerName: string;
    totalSessions: number;
    completedSessions: number;
    totalPrograms: number;
    trainingHours: number;
    trainingDays: number;
    totalTraineeSessions: number;
    uniquePersonsTrained: number;
    firstTimeTrainees: number;
    firstTimerPercentage: number;
    averageRating: number | null;
}

/**
 * Fetch detailed Trainer Report data.
 * If user is TRAINER role, strictly enforces their own identity.
 * If user is ADMIN role, can query any trainer or all trainers.
 */
export async function getTrainerReportData(
    requestedTrainerName?: string,
    requestedFinancialYear?: string
): Promise<{
    report: TrainerReportStats | null;
    availableTrainers?: string[];
    availableYears?: string[];
    error?: string;
}> {
    const session = await auth();
    if (!session?.user) {
        return { report: null, error: 'Unauthorized' };
    }

    const userRole = (session.user as any)?.role;
    let effectiveTrainerName = requestedTrainerName;

    // Security: If user is TRAINER, lock strictly to their own name
    if (userRole === 'TRAINER') {
        const trainerRecord = await db.trainer.findUnique({
            where: { email: session.user.email! }
        });
        if (!trainerRecord) {
            return { 
                report: null, 
                error: `No trainer profile associated with ${session.user.email}. Please contact the administrator.` 
            };
        }
        effectiveTrainerName = trainerRecord.name;
    }

    try {
        const isAllTrainers = !effectiveTrainerName || effectiveTrainerName === 'ALL';
        const selectedFinancialYear = (requestedFinancialYear && requestedFinancialYear.toUpperCase() !== 'ALL')
            ? requestedFinancialYear.replace(/^FY\s*/i, '').trim()
            : 'ALL';
        const dateRange = getFinancialYearDateRange(selectedFinancialYear);

        // 1. Fetch available trainers list (for admins / dropdowns)
        const allTrainersList = await db.trainer.findMany({
            select: { name: true },
            orderBy: { name: 'asc' }
        });
        const availableTrainers = allTrainersList.map(t => t.name);

        // Fetch distinct financial years across the system
        const [histYears, sysYears] = await Promise.all([
            db.trainingHistory.findMany({
                where: { year: { not: null } },
                select: { year: true },
                distinct: ['year']
            }),
            db.systemTrainingHistory.findMany({
                where: { year: { not: null } },
                select: { year: true },
                distinct: ['year']
            })
        ]);

        const currentFY = getFinancialYear(new Date());
        const yearsSet = new Set<string>();
        if (currentFY) yearsSet.add(currentFY);
        histYears.forEach(h => { if (h.year && h.year.trim()) yearsSet.add(h.year.trim()); });
        sysYears.forEach(s => { if (s.year && s.year.trim()) yearsSet.add(s.year.trim()); });

        const availableYears = Array.from(yearsSet).sort((a, b) => {
            const getStart = (yr: string) => parseInt(yr.split('-')[0], 10) || 0;
            return getStart(b) - getStart(a);
        });

        // 2. Fetch Training Sessions matching the filter
        const sessionWhere: any = {};
        if (!isAllTrainers && effectiveTrainerName) {
            sessionWhere.trainerName = {
                contains: effectiveTrainerName.trim(),
                mode: 'insensitive'
            };
        }
        if (selectedFinancialYear !== 'ALL' && dateRange) {
            sessionWhere.startDate = {
                gte: dateRange.queryStart,
                lte: dateRange.queryEnd
            };
        }

        const rawSessions = await db.trainingSession.findMany({
            where: sessionWhere,
            include: {
                enrollments: {
                    select: {
                        id: true,
                        empId: true,
                        employeeName: true,
                        status: true,
                        trainerRating: true,
                        averageRating: true,
                        recommendationRating: true,
                        topicsLearned: true,
                        actionPlan: true,
                        suggestions: true,
                        updatedAt: true
                    }
                },
                attendanceRecords: {
                    select: {
                        empId: true,
                        status: true
                    }
                }
            },
            orderBy: { startDate: 'desc' }
        });

        // Enforce exact financial year match on sessions
        const sessions = selectedFinancialYear === 'ALL'
            ? rawSessions
            : rawSessions.filter(s => getFinancialYear(s.startDate) === selectedFinancialYear);

        let totalTrainingHours = 0;
        let totalTrainingDays = 0;
        sessions.forEach(s => {
            if (s.status === 'Completed') {
                totalTrainingHours += s.trainingHours || 0;
                totalTrainingDays += s.trainingDays || 0;
            }
        });

        // 3. Fetch Historical & Modern records from systemTrainingHistory and trainingHistory
        const historyWhere: any = {
            status: { not: 'Absent' }
        };
        if (!isAllTrainers && effectiveTrainerName) {
            historyWhere.trainerName = {
                contains: effectiveTrainerName.trim(),
                mode: 'insensitive'
            };
        }
        if (selectedFinancialYear !== 'ALL' && dateRange) {
            historyWhere.OR = [
                { year: selectedFinancialYear },
                {
                    startDate: {
                        gte: dateRange.queryStart,
                        lte: dateRange.queryEnd
                    }
                }
            ];
        }

        const [sysRecords, legacyRecords] = await Promise.all([
            db.systemTrainingHistory.findMany({
                where: historyWhere,
                select: {
                    id: true,
                    empId: true,
                    employeeName: true,
                    programName: true,
                    startDate: true,
                    endDate: true,
                    trainingHours: true,
                    trainingDays: true,
                    department: true,
                    section: true,
                    location: true,
                    employeeGroup: true,
                    averageRating: true,
                    year: true,
                    sessionId: true
                },
                orderBy: { startDate: 'asc' }
            }),
            db.trainingHistory.findMany({
                where: historyWhere,
                select: {
                    id: true,
                    empId: true,
                    employeeName: true,
                    programName: true,
                    startDate: true,
                    endDate: true,
                    trainingHours: true,
                    trainingDays: true,
                    department: true,
                    section: true,
                    location: true,
                    employeeGroup: true,
                    averageRating: true,
                    year: true,
                    sessionId: true
                },
                orderBy: { startDate: 'asc' }
            })
        ]);

        // Merge records (deduplicating if any duplicate IDs exist, enforcing FY)
        const seenRecordKeys = new Set<string>();
        const combinedRecords: typeof sysRecords = [];

        for (const r of [...legacyRecords, ...sysRecords]) {
            if (selectedFinancialYear !== 'ALL') {
                const matchesFY = r.year === selectedFinancialYear || getFinancialYear(r.startDate) === selectedFinancialYear;
                if (!matchesFY) continue;
            }
            const key = `${r.empId}_${r.programName}_${r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : ''}`;
            if (!seenRecordKeys.has(key)) {
                seenRecordKeys.add(key);
                combinedRecords.push(r as any);
            }
        }

        // Pipeline stats: count all unique session IDs across modern completed sessions, system training history, and legacy history
        const completedSessionIds = new Set<string>();
        sessions.forEach(s => {
            if (s.status === 'Completed' && s.id) {
                completedSessionIds.add(String(s.id));
            }
        });
        combinedRecords.forEach(r => {
            if (r.sessionId) {
                completedSessionIds.add(String(r.sessionId));
            }
        });

        const completedSessions = completedSessionIds.size;
        const scheduledSessions = sessions.filter(s => s.status === 'Scheduled').length;
        const formingSessions = sessions.filter(s => s.status === 'Forming').length;
        const cancelledSessions = sessions.filter(s => s.status === 'Cancelled').length;
        const totalSessions = completedSessions + scheduledSessions + formingSessions + cancelledSessions;
        const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : (completedSessions > 0 ? 100 : 0);

        // Add additional hours/days from completed history if training_sessions table has fewer entries
        const historyHours = combinedRecords.reduce((acc, r) => acc + (r.trainingHours || 0), 0);
        const historyDays = combinedRecords.reduce((acc, r) => acc + (r.trainingDays || 0), 0);
        if (totalTrainingHours === 0 && historyHours > 0) {
            totalTrainingHours = historyHours;
            totalTrainingDays = historyDays;
        }

        // Unique employees trained
        const uniqueEmpIds = Array.from(new Set(combinedRecords.map(r => r.empId).filter(Boolean)));
        const uniquePersonsTrained = uniqueEmpIds.length;
        const totalTraineeSessions = combinedRecords.length;

        // 4. Calculate First-Time Trainees (Untrained -> Trained Baseline Conversion)
        // Find the absolute earliest training date for each of these employees across the whole company
        let totalFirstTimers = 0;
        const firstTimersRoster: TrainerReportStats['firstTimers']['firstTimersRoster'] = [];

        if (uniqueEmpIds.length > 0) {
            // Chunk uniqueEmpIds if large to avoid query limits
            const chunkSize = 2000;
            const earliestDateMap = new Map<string, Date>();

            for (let i = 0; i < uniqueEmpIds.length; i += chunkSize) {
                const chunk = uniqueEmpIds.slice(i, i + chunkSize);

                const [earliestLegacy, earliestSys] = await Promise.all([
                    db.trainingHistory.groupBy({
                        by: ['empId'],
                        where: { empId: { in: chunk } },
                        _min: { startDate: true }
                    }),
                    db.systemTrainingHistory.groupBy({
                        by: ['empId'],
                        where: { empId: { in: chunk } },
                        _min: { startDate: true }
                    })
                ]);

                for (const item of earliestLegacy) {
                    if (item._min.startDate) {
                        const current = earliestDateMap.get(item.empId);
                        if (!current || item._min.startDate < current) {
                            earliestDateMap.set(item.empId, item._min.startDate);
                        }
                    }
                }
                for (const item of earliestSys) {
                    if (item._min.startDate) {
                        const current = earliestDateMap.get(item.empId);
                        if (!current || item._min.startDate < current) {
                            earliestDateMap.set(item.empId, item._min.startDate);
                        }
                    }
                }
            }

            // For each unique employee, check if their earliest session was facilitated by this trainer
            const countedFirstTimers = new Set<string>();

            // Sort combined records chronologically
            combinedRecords.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            for (const record of combinedRecords) {
                if (!record.empId || countedFirstTimers.has(record.empId)) continue;

                const globalEarliest = earliestDateMap.get(record.empId);
                if (globalEarliest && new Date(record.startDate).getTime() <= globalEarliest.getTime()) {
                    countedFirstTimers.add(record.empId);
                    totalFirstTimers++;
                    firstTimersRoster.push({
                        empId: record.empId,
                        name: record.employeeName || 'Unknown',
                        department: record.department || 'N/A',
                        section: record.section || 'N/A',
                        location: record.location || 'N/A',
                        grade: record.employeeGroup || 'N/A',
                        programName: record.programName || 'Training Program',
                        date: record.startDate ? new Date(record.startDate).toISOString().slice(0, 10) : 'N/A',
                        hours: record.trainingHours || 0
                    });
                }
            }
        }

        const firstTimerPercentage = uniquePersonsTrained > 0 
            ? Math.round((totalFirstTimers / uniquePersonsTrained) * 100) 
            : 0;
        const refresherCount = Math.max(0, uniquePersonsTrained - totalFirstTimers);

        // 5. Ratings & Quality Insights
        const allRatings: number[] = [];
        let recommendedYes = 0;
        let recommendedTotal = 0;
        const recentFeedback: TrainerReportStats['quality']['recentFeedback'] = [];

        sessions.forEach(s => {
            s.enrollments.forEach(en => {
                const r = en.trainerRating || en.averageRating;
                if (r && r > 0) allRatings.push(r);

                if (en.recommendationRating !== null && en.recommendationRating !== undefined) {
                    recommendedTotal++;
                    if (en.recommendationRating) recommendedYes++;
                }

                if (en.topicsLearned || en.actionPlan || en.suggestions) {
                    recentFeedback.push({
                        empName: en.employeeName,
                        programName: s.programName,
                        rating: r || null,
                        topicsLearned: en.topicsLearned,
                        actionPlan: en.actionPlan,
                        suggestions: en.suggestions,
                        date: en.updatedAt ? new Date(en.updatedAt).toISOString().slice(0, 10) : ''
                    });
                }
            });
        });

        // Also check ratings in history
        combinedRecords.forEach(r => {
            if (r.averageRating && r.averageRating > 0) {
                allRatings.push(r.averageRating);
            }
        });

        const averageRating = allRatings.length > 0 
            ? Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)) 
            : null;
        const recommendationRate = recommendedTotal > 0 
            ? Math.round((recommendedYes / recommendedTotal) * 100) 
            : null;

        // 6. Program Breakdown
        const programMap = new Map<string, { sessions: number; hours: number; persons: number; sessionIds: Set<string> }>();
        sessions.forEach(s => {
            const p = s.programName || 'Other';
            const curr = programMap.get(p) || { sessions: 0, hours: 0, persons: 0, sessionIds: new Set<string>() };
            if (s.id) curr.sessionIds.add(String(s.id));
            curr.sessions = curr.sessionIds.size;
            curr.hours += s.trainingHours || 0;
            curr.persons += s.enrollments.filter(e => e.status !== 'Absent').length;
            programMap.set(p, curr);
        });

        combinedRecords.forEach(r => {
            const p = r.programName || 'Other';
            if (!programMap.has(p)) {
                const sIds = new Set<string>();
                if (r.sessionId) sIds.add(String(r.sessionId));
                programMap.set(p, {
                    sessions: sIds.size || 1,
                    hours: r.trainingHours || 0,
                    persons: 1,
                    sessionIds: sIds
                });
            } else {
                const curr = programMap.get(p)!;
                if (r.sessionId) {
                    curr.sessionIds.add(String(r.sessionId));
                    curr.sessions = curr.sessionIds.size;
                }
                curr.persons++;
            }
        });

        const programBreakdown = Array.from(programMap.entries())
            .map(([name, val]) => ({
                name,
                sessionsCount: val.sessions,
                totalHours: Math.round(val.hours),
                personsTrained: val.persons
            }))
            .sort((a, b) => b.personsTrained - a.personsTrained)
            .slice(0, 10);

        // 7. Department Breakdown
        const deptMap = new Map<string, { count: number; firstTimers: number }>();
        const firstTimerIds = new Set(firstTimersRoster.map(f => f.empId));

        combinedRecords.forEach(r => {
            const d = r.department || r.section || 'General / Unassigned';
            const curr = deptMap.get(d) || { count: 0, firstTimers: 0 };
            curr.count++;
            if (r.empId && firstTimerIds.has(r.empId)) {
                curr.firstTimers++;
            }
            deptMap.set(d, curr);
        });

        const departmentBreakdown = Array.from(deptMap.entries())
            .map(([name, val]) => ({
                name,
                count: val.count,
                firstTimers: val.firstTimers
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        // 8. Monthly Trend
        const monthMap = new Map<string, { sessions: number; trainees: number; firstTimers: number; sessionIds: Set<string> }>();

        if (selectedFinancialYear !== 'ALL') {
            // Pre-seed the 12 calendar months for this Financial Year (Apr to Mar)
            const parts = selectedFinancialYear.split('-');
            if (parts.length === 2) {
                let startY = parseInt(parts[0], 10);
                let endY = parseInt(parts[1], 10);
                if (startY < 100) startY = (startY > 50 ? 1900 : 2000) + startY;
                if (endY < 100) endY = (endY > 50 ? 1900 : 2000) + endY;

                const monthsConfig = [
                    { m: 3, y: startY }, // Apr
                    { m: 4, y: startY }, // May
                    { m: 5, y: startY }, // Jun
                    { m: 6, y: startY }, // Jul
                    { m: 7, y: startY }, // Aug
                    { m: 8, y: startY }, // Sep
                    { m: 9, y: startY }, // Oct
                    { m: 10, y: startY }, // Nov
                    { m: 11, y: startY }, // Dec
                    { m: 0, y: endY },   // Jan
                    { m: 1, y: endY },   // Feb
                    { m: 2, y: endY },   // Mar
                ];

                monthsConfig.forEach(({ m, y }) => {
                    const d = new Date(y, m, 1);
                    const mKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
                    monthMap.set(mKey, { sessions: 0, trainees: 0, firstTimers: 0, sessionIds: new Set<string>() });
                });
            }
        }

        combinedRecords.forEach(r => {
            if (!r.startDate) return;
            const d = new Date(r.startDate);
            const mKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
            if (selectedFinancialYear !== 'ALL' && !monthMap.has(mKey)) return;
            const curr = monthMap.get(mKey) || { sessions: 0, trainees: 0, firstTimers: 0, sessionIds: new Set<string>() };
            curr.trainees++;
            if (r.sessionId) {
                curr.sessionIds.add(String(r.sessionId));
                curr.sessions = curr.sessionIds.size;
            }
            if (r.empId && firstTimerIds.has(r.empId)) {
                curr.firstTimers++;
            }
            monthMap.set(mKey, curr);
        });

        sessions.forEach(s => {
            if (!s.startDate) return;
            const d = new Date(s.startDate);
            const mKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
            if (selectedFinancialYear !== 'ALL' && !monthMap.has(mKey)) return;
            const curr = monthMap.get(mKey) || { sessions: 0, trainees: 0, firstTimers: 0, sessionIds: new Set<string>() };
            if (s.id) {
                curr.sessionIds.add(String(s.id));
                curr.sessions = curr.sessionIds.size;
            }
            monthMap.set(mKey, curr);
        });

        const allMonths = Array.from(monthMap.entries()).map(([month, data]) => ({
            month,
            sessions: data.sessions,
            trainees: data.trainees,
            firstTimers: data.firstTimers
        }));

        const monthlyTrend = selectedFinancialYear !== 'ALL'
            ? allMonths
            : allMonths.slice(-12);

        // 9. Recent Sessions List
        const recentSessions = sessions.slice(0, 15).map(s => ({
            id: s.id,
            programName: s.programName,
            status: s.status,
            startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0, 10) : '',
            endDate: s.endDate ? new Date(s.endDate).toISOString().slice(0, 10) : '',
            trainingHours: s.trainingHours || 0,
            trainingDays: s.trainingDays || 0,
            location: s.location || 'N/A',
            enrolledCount: s.enrollments.length,
            attendedCount: s.enrollments.filter(e => e.status !== 'Absent').length || s.attendanceRecords.filter(a => a.status === 'Present').length
        }));

        const report: TrainerReportStats = {
            trainerName: effectiveTrainerName || 'All Trainers',
            isAllTrainers,
            selectedFinancialYear,
            pipeline: {
                totalSessions,
                completedSessions,
                scheduledSessions,
                formingSessions,
                cancelledSessions,
                completionRate
            },
            output: {
                totalTrainingHours: Math.round(totalTrainingHours),
                totalTrainingDays: Math.round(totalTrainingDays),
                totalTraineeSessions,
                uniquePersonsTrained,
                totalPrograms: programMap.size
            },
            firstTimers: {
                totalFirstTimers,
                firstTimerPercentage,
                refresherCount,
                firstTimersRoster: firstTimersRoster.slice(0, 500) // cap for client payload
            },
            quality: {
                averageRating,
                totalRatingsCount: allRatings.length,
                recommendationRate,
                recentFeedback: recentFeedback.slice(0, 20)
            },
            programBreakdown,
            departmentBreakdown,
            monthlyTrend,
            recentSessions
        };

        return {
            report,
            availableTrainers,
            availableYears
        };

    } catch (error) {
        console.error('Error generating trainer report:', error);
        return { report: null, error: 'Failed to generate report' };
    }
}

/**
 * Fetch Admin Comparison Leaderboard across all trainers.
 * Admin only.
 */
export async function getAdminTrainersLeaderboard(financialYear: string = 'ALL'): Promise<{
    leaderboard: TrainerComparisonItem[];
    globalSummary: {
        totalTrainers: number;
        totalSessions: number;
        totalPrograms: number;
        totalHours: number;
        totalTrainees: number;
        totalFirstTimers: number;
        firstTimerPercentage: number;
        avgRating: number | null;
    } | null;
    availableYears?: string[];
    selectedFinancialYear?: string;
    error?: string;
}> {
    const session = await auth();
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
        return { leaderboard: [], globalSummary: null, error: 'Unauthorized: Admin access required' };
    }

    try {
        const trainers = await db.trainer.findMany({
            select: { name: true },
            orderBy: { name: 'asc' }
        });

        // Parallel aggregation of all trainer stats for requested financial year
        const results = await Promise.all(
            trainers.map(t => getTrainerReportData(t.name, financialYear))
        );

        const availableYears = results.find(r => r.availableYears && r.availableYears.length > 0)?.availableYears || [];

        const leaderboard: TrainerComparisonItem[] = [];
        let totalSessionsSum = 0;
        let totalHoursSum = 0;
        let totalTraineesSum = 0;
        let totalFirstTimersSum = 0;
        const orgProgramsSet = new Set<string>();
        const allRatings: number[] = [];

        results.forEach((res, idx) => {
            const r = res.report;
            if (!r) return;

            r.programBreakdown?.forEach(p => {
                if (p.name) orgProgramsSet.add(p.name);
            });

            leaderboard.push({
                trainerName: trainers[idx].name,
                totalSessions: r.pipeline.totalSessions,
                completedSessions: r.pipeline.completedSessions,
                totalPrograms: r.output.totalPrograms,
                trainingHours: r.output.totalTrainingHours,
                trainingDays: r.output.totalTrainingDays,
                totalTraineeSessions: r.output.totalTraineeSessions,
                uniquePersonsTrained: r.output.uniquePersonsTrained,
                firstTimeTrainees: r.firstTimers.totalFirstTimers,
                firstTimerPercentage: r.firstTimers.firstTimerPercentage,
                averageRating: r.quality.averageRating
            });

            totalSessionsSum += r.pipeline.completedSessions;
            totalHoursSum += r.output.totalTrainingHours;
            totalTraineesSum += r.output.uniquePersonsTrained;
            totalFirstTimersSum += r.firstTimers.totalFirstTimers;
            if (r.quality.averageRating) allRatings.push(r.quality.averageRating);
        });

        // Rank primarily by Training Hours delivered, then completed sessions and programs
        leaderboard.sort((a, b) => b.trainingHours - a.trainingHours || b.completedSessions - a.completedSessions || b.totalPrograms - a.totalPrograms);

        const globalSummary = {
            totalTrainers: trainers.length,
            totalSessions: totalSessionsSum,
            totalPrograms: orgProgramsSet.size,
            totalHours: totalHoursSum,
            totalTrainees: totalTraineesSum,
            totalFirstTimers: totalFirstTimersSum,
            firstTimerPercentage: totalTraineesSum > 0 ? Math.round((totalFirstTimersSum / totalTraineesSum) * 100) : 0,
            avgRating: allRatings.length > 0 ? Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)) : null
        };

        return { leaderboard, globalSummary, availableYears, selectedFinancialYear: financialYear };
    } catch (err) {
        console.error('Error in getAdminTrainersLeaderboard:', err);
        return { leaderboard: [], globalSummary: null, error: 'Database error' };
    }
}
