'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getTrainingHistory(params: {
    page?: number;
    pageSize?: number;
    searchName?: string;
    year?: string;
    month?: string;
    sessionId?: string;
    startDate?: string;
    programName?: string;
    region?: string;
    organization?: string;
}) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const baseWhere: any = {};
    if (params.searchName) {
        baseWhere.OR = [
            { employeeName: { contains: params.searchName, mode: 'insensitive' } },
            { empId: { contains: params.searchName, mode: 'insensitive' } },
            { aadharNumber: { contains: params.searchName, mode: 'insensitive' } },
            { employee: { email: { contains: params.searchName, mode: 'insensitive' } } }
        ];
    }
    if (params.year) {
        baseWhere.year = params.year;
    }
    if (params.month) {
        baseWhere.month = params.month;
    }
    if (params.sessionId) {
        baseWhere.sessionId = { contains: params.sessionId, mode: 'insensitive' };
    }
    if (params.programName) {
        baseWhere.programName = params.programName; // exact match for dropdown
    }
    if (params.startDate) {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(params.startDate);
        end.setHours(23, 59, 59, 999);
        baseWhere.startDate = { gte: start, lte: end };
    }
    if (params.organization) {
        baseWhere.organization = params.organization;
    }

    const where1 = { ...baseWhere };
    const where2 = { ...baseWhere };

    if (params.region) {
        where1.region = params.region;
        where2.employeeRegion = params.region;
    }

    // Fetch from both tables
    const [legacyData, systemData] = await Promise.all([
        db.trainingHistory.findMany({
            where: where1,
        }),
        db.systemTrainingHistory.findMany({
            where: where2,
        }),
    ]);

    // Combine and sort
    const combinedData = [...legacyData, ...systemData].sort((a, b) => {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    const totalCount = combinedData.length;
    const paginatedData = combinedData.slice((page - 1) * pageSize, page * pageSize);

    return {
        data: paginatedData,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}

export async function deleteTrainingHistory(id: string) {
    try {
        let deleted = false;
        try {
            await db.trainingHistory.delete({
                where: { id },
            });
            deleted = true;
        } catch (e) {
            // Ignore if not found in legacy table
        }
        
        if (!deleted) {
            await db.systemTrainingHistory.delete({
                where: { id },
            });
        }
        
        revalidatePath('/admin/tni-dashboard/training-history');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting training history:', error);
        return { success: false, error: error.message || 'Failed to delete record' };
    }
}

export async function getTrainingHistoryFilters() {
    const [
        years1, months1, programs1, startDates1, regions1, orgs1,
        years2, months2, programs2, startDates2, regions2, orgs2
    ] = await Promise.all([
        db.trainingHistory.findMany({ where: { year: { not: null } }, distinct: ['year'], select: { year: true } }),
        db.trainingHistory.findMany({ where: { month: { not: null } }, distinct: ['month'], select: { month: true } }),
        db.trainingHistory.findMany({ distinct: ['programName'], select: { programName: true } }),
        db.trainingHistory.findMany({ distinct: ['startDate'], select: { startDate: true } }),
        db.trainingHistory.findMany({ where: { region: { not: null } }, distinct: ['region'], select: { region: true } }),
        db.trainingHistory.findMany({ where: { organization: { not: null } }, distinct: ['organization'], select: { organization: true } }),
        
        db.systemTrainingHistory.findMany({ where: { year: { not: null } }, distinct: ['year'], select: { year: true } }),
        db.systemTrainingHistory.findMany({ where: { month: { not: null } }, distinct: ['month'], select: { month: true } }),
        db.systemTrainingHistory.findMany({ distinct: ['programName'], select: { programName: true } }),
        db.systemTrainingHistory.findMany({ distinct: ['startDate'], select: { startDate: true } }),
        db.systemTrainingHistory.findMany({ where: { employeeRegion: { not: null } }, distinct: ['employeeRegion'], select: { employeeRegion: true } }),
        db.systemTrainingHistory.findMany({ where: { organization: { not: null } }, distinct: ['organization'], select: { organization: true } })
    ]);

    const allYears = Array.from(new Set([...years1.map(y => y.year), ...years2.map(y => y.year)])).filter(Boolean).sort().reverse();
    const allMonths = Array.from(new Set([...months1.map(m => m.month), ...months2.map(m => m.month)])).filter(Boolean);
    const allPrograms = Array.from(new Set([...programs1.map(p => p.programName), ...programs2.map(p => p.programName)])).filter(Boolean).sort();
    const allRegions = Array.from(new Set([...regions1.map(r => r.region), ...regions2.map(r => r.employeeRegion)])).filter(Boolean).sort();
    const allOrgs = Array.from(new Set([...orgs1.map(o => o.organization), ...orgs2.map(o => o.organization)])).filter(Boolean).sort();

    const startDates = [...startDates1, ...startDates2]
        .map(d => d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '')
        .filter(Boolean)
        .sort()
        .reverse();
        
    const uniqueStartDates = Array.from(new Set(startDates));

    return {
        years: allYears as string[],
        months: allMonths as string[],
        programNames: allPrograms as string[],
        startDates: uniqueStartDates,
        regions: allRegions as string[],
        organizations: allOrgs as string[]
    };
}
