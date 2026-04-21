'use server';

import { db } from '@/lib/prisma';
import { auth } from '@/auth';
import { unstable_cache } from 'next/cache';

const getCachedTniReportData = unstable_cache(
    async () => {
        // Parallel fetching for performance
        const [
            topPrograms,
            statusCounts,
            deptDemand,
            siteDemand,
            gradeDemand,
            sourceDemand,
            totalEmployees,
            totalUniquePrograms,
            locations,
            sections
        ] = await Promise.all([
            // 1. Top 15 Programs by Pending nominations
            db.nomination.groupBy({
                by: ['programId'],
                where: { status: 'Pending' },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } }
            }),
            // 2. Overall Status Breakdown
            db.nomination.groupBy({
                by: ['status'],
                _count: { id: true }
            }),
            // 3. Department-wise Demand
            db.nomination.groupBy({
                by: ['empId'], // Internal join logic needed for better grouping
                where: { status: 'Pending' },
                _count: { id: true }
            }).then(async () => {
                // Since we can't join in groupBy directly, we fetch aggregated counts from joins if possible
                // or we do a manual count from the employees table joined to nominations
                return await db.employee.groupBy({
                    by: ['sectionName'],
                    where: { nominations: { some: { status: 'Pending' } } },
                    _count: { id: true }
                });
            }),
            // 4. Site-wise Demand
            db.employee.groupBy({
                by: ['location'],
                where: { nominations: { some: { status: 'Pending' } } },
                _count: { id: true }
            }),
            // 5. Grade-wise Demand
            db.employee.groupBy({
                by: ['grade'],
                where: { nominations: { some: { status: 'Pending' } } },
                _count: { id: true }
            }),
            // 6. Source Distribution
            db.nomination.groupBy({
                by: ['source'],
                _count: { id: true }
            }),
            // Summary Stats
            db.employee.count(),
            db.program.count(),
            db.location.findMany({ select: { name: true } }),
            db.section.findMany({ select: { name: true } })
        ]);

        // Resolve Program Names for Top 15
        const programNames = await db.program.findMany({
            where: { id: { in: topPrograms.map(p => p.programId) } },
            select: { id: true, name: true, category: true }
        });

        const programIdToName = new Map(programNames.map(p => [p.id, { name: p.name, category: p.category }]));

        return {
            topPrograms: topPrograms.map(p => ({
                id: p.programId,
                count: p._count.id,
                name: programIdToName.get(p.programId)?.name || 'Unknown',
                category: programIdToName.get(p.programId)?.category || 'COMMON'
            })),
            statusCounts: statusCounts.map(s => ({ name: s.status, value: s._count.id })),
            deptDemand: deptDemand.map(d => ({ name: d.sectionName || 'N/A', value: d._count.id })),
            siteDemand: siteDemand.map(s => ({ name: s.location || 'N/A', value: s._count.id })),
            gradeDemand: gradeDemand.map(g => ({ name: g.grade || 'N/A', value: g._count.id })),
            sourceDemand: sourceDemand.map(s => ({ name: s.source || 'N/A', value: s._count.id })),
            summary: {
                totalEmployees,
                totalUniquePrograms,
                totalNominations: statusCounts.reduce((acc, curr) => acc + curr._count.id, 0),
                completionRate: (statusCounts.find(s => s.status === 'Completed')?._count.id || 0) / (statusCounts.reduce((acc, curr) => acc + curr._count.id, 0) || 1) * 100
            },
            filters: {
                locations: locations.map(l => l.name),
                departments: sections.map(s => s.name)
            }
        };
    },
    ['tni-reports-data'],
    { revalidate: 3600, tags: ['tni-reports'] }
);

export async function getTniReportData() {
    if (!await auth()) return null;

    try {
        return await getCachedTniReportData();
    } catch (error) {
        console.error('Failed to fetch report data', error);
        return null;
    }
}

/**
 * Fetch detailed participants for a specific program to see "Depth"
 */
export async function getProgramParticipantDepth(programId: string) {
    if (!await auth()) return null;

    return await db.nomination.findMany({
        where: { programId, status: 'Pending' },
        include: {
            employee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    grade: true,
                    sectionName: true,
                    location: true,
                    subDepartment: true
                }
            }
        }
    });
}
