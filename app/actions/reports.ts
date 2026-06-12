'use server';

import { db } from '@/lib/prisma';
import { auth } from '@/auth';
import { unstable_cache } from 'next/cache';

const getCachedTniReportData = unstable_cache(async (site?: string) => {

    try {
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
            sections,
            categoryDemand
        ] = await Promise.all([
            // 1. Top 15 Programs by Pending nominations
            db.nomination.groupBy({
                by: ['programId'],
                where: { 
                    status: 'Pending',
                    ...(site ? { employee: { location: site } } : {})
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 15
            }),
            // 2. Overall Status Breakdown
            db.nomination.groupBy({
                by: ['status'],
                where: site ? { employee: { location: site } } : {},
                _count: { id: true }
            }),
            // 3. Department-wise Demand
            db.employee.groupBy({
                by: ['sectionName'],
                where: { 
                    nominations: { some: { status: 'Pending' } },
                    ...(site ? { location: site } : {})
                },
                _count: { id: true }
            }),
            // 4. Site-wise Demand (Always global for the chart, or filtered if needed)
            db.employee.groupBy({
                by: ['location'],
                where: { nominations: { some: { status: 'Pending' } } },
                _count: { id: true }
            }),
            // 5. Grade-wise Demand
            db.employee.groupBy({
                by: ['grade'],
                where: { 
                    nominations: { some: { status: 'Pending' } },
                    ...(site ? { location: site } : {})
                },
                _count: { id: true }
            }),
            // 6. Source Distribution
            db.nomination.groupBy({
                by: ['source'],
                where: site ? { employee: { location: site } } : {},
                _count: { id: true }
            }),
            // Summary Stats
            db.employee.count({ where: site ? { location: site } : {} }),
            db.program.count(),
            db.location.findMany({ select: { name: true } }),
            db.section.findMany({ select: { name: true } }),
            // 7. Category-wise Demand
            db.program.groupBy({
                by: ['category'],
                where: { 
                    nominations: { 
                        some: { 
                            status: 'Pending',
                            ...(site ? { employee: { location: site } } : {})
                        } 
                    }
                },
                _count: { id: true }
            })
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
            categoryDemand: categoryDemand.map(c => ({ name: c.category || 'COMMON', value: c._count.id })),
            filters: {
                locations: locations.map(l => l.name),
                departments: sections.map(s => s.name)
            }
        };
    } catch (error) {
        console.error('Failed to fetch report data', error);
        return null;
    }
}, ['tni-report-data'], { revalidate: 300, tags: ['reports'] });

export async function getTniReportData(site?: string) {
    if (!await auth()) return null;
    return getCachedTniReportData(site);
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
                    projectLocation: true
                }
            }
        }
    });
}
/**
 * Fetch detailed participants with flexible filters (Site, Program, etc.)
 */
export async function getFilteredParticipantDepth(filters: { programId?: string; site?: string }) {
    if (!await auth()) return null;

    const where: any = { status: 'Pending' };
    
    if (filters.programId) {
        where.programId = filters.programId;
    }
    
    if (filters.site) {
        where.employee = { location: filters.site };
    }

    return await db.nomination.findMany({
        where,
        include: {
            employee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    grade: true,
                    sectionName: true,
                    location: true,
                    projectLocation: true
                }
            },
            program: {
                select: {
                    id: true,
                    name: true,
                    category: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getAllNominationsForExport() {
    if (!await auth()) return null;

    return await db.nomination.findMany({
        include: {
            employee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    grade: true,
                    sectionName: true,
                    location: true,
                    projectLocation: true,
                    designation: true,
                    managerName: true
                }
            },
            program: {
                select: {
                    name: true,
                    category: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getUntrainedPendingTrainees() {
    if (!await auth()) return null;

    const rawData = await db.$queryRaw<any[]>`
        SELECT 
            e.emp_id as "id", e.name, e.email, e.grade, e.section_name as "sectionName", e.location, e.project_location as "projectLocation", e.manager_name as "managerName",
            n.id as "nomId", n.status,
            p.name as "programName", p.category
        FROM "employees" e
        INNER JOIN "nominations" n ON e.emp_id = n.emp_id
        INNER JOIN "programs" p ON n.program_id = p.id
        WHERE n.status = 'Pending'
        AND NOT EXISTS (
            SELECT 1 FROM "training_history" th WHERE th.emp_id = e.emp_id
        )
        ORDER BY e.name ASC
    `;

    // Group by employee ID in memory
    const employeeMap = new Map<string, any>();

    for (const row of rawData) {
        if (!employeeMap.has(row.id)) {
            employeeMap.set(row.id, {
                id: row.id,
                name: row.name,
                email: row.email,
                grade: row.grade,
                sectionName: row.sectionName,
                location: row.location,
                projectLocation: row.projectLocation,
                managerName: row.managerName,
                nominations: []
            });
        }
        
        employeeMap.get(row.id).nominations.push({
            id: row.nomId,
            status: row.status,
            program: {
                name: row.programName,
                category: row.category
            }
        });
    }

    return Array.from(employeeMap.values());
}
