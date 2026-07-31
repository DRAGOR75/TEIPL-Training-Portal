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

    const where: any = {};
    if (params.searchName) {
        where.employeeName = { contains: params.searchName, mode: 'insensitive' };
    }
    if (params.year) {
        where.year = params.year;
    }
    if (params.month) {
        where.month = params.month;
    }
    if (params.sessionId) {
        where.sessionId = { contains: params.sessionId, mode: 'insensitive' };
    }
    if (params.programName) {
        where.programName = params.programName; // exact match for dropdown
    }
    if (params.startDate) {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(params.startDate);
        end.setHours(23, 59, 59, 999);
        where.startDate = { gte: start, lte: end };
    }
    if (params.region) {
        where.region = params.region;
    }
    if (params.organization) {
        where.organization = params.organization;
    }

    const [data, totalCount] = await Promise.all([
        db.trainingHistory.findMany({
            where,
            orderBy: { startDate: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        db.trainingHistory.count({ where }),
    ]);

    return {
        data,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}

export async function deleteTrainingHistory(id: string) {
    try {
        await db.trainingHistory.delete({
            where: { id },
        });
        revalidatePath('/admin/tni-dashboard/training-history');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting training history:', error);
        return { success: false, error: error.message || 'Failed to delete record' };
    }
}

export async function getTrainingHistoryFilters() {
    const [years, months, programs, startDatesData, regionsData, orgsData] = await Promise.all([
        db.trainingHistory.findMany({
            where: { year: { not: null } },
            distinct: ['year'],
            select: { year: true },
            orderBy: { year: 'desc' }
        }),
        db.trainingHistory.findMany({
            where: { month: { not: null } },
            distinct: ['month'],
            select: { month: true },
            orderBy: { month: 'asc' }
        }),
        db.trainingHistory.findMany({
            distinct: ['programName'],
            select: { programName: true },
            orderBy: { programName: 'asc' }
        }),
        db.trainingHistory.findMany({
            distinct: ['startDate'],
            select: { startDate: true },
            orderBy: { startDate: 'desc' }
        }),
        db.trainingHistory.findMany({
            where: { region: { not: null } },
            distinct: ['region'],
            select: { region: true },
            orderBy: { region: 'asc' }
        }),
        db.trainingHistory.findMany({
            where: { organization: { not: null } },
            distinct: ['organization'],
            select: { organization: true },
            orderBy: { organization: 'asc' }
        })
    ]);

    const startDates = startDatesData
        .map(d => d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '')
        .filter(Boolean);

    // Remove duplicates since different times on the same date will map to the same YYYY-MM-DD
    const uniqueStartDates = Array.from(new Set(startDates));

    return {
        years: years.map(y => y.year as string).filter(Boolean),
        months: months.map(m => m.month as string).filter(Boolean),
        programNames: programs.map(p => p.programName as string).filter(Boolean),
        startDates: uniqueStartDates,
        regions: regionsData.map(r => r.region as string).filter(Boolean),
        organizations: orgsData.map(o => o.organization as string).filter(Boolean)
    };
}

