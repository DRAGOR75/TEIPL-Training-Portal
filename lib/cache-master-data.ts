import { db } from './prisma';
import { unstable_cache } from 'next/cache';

/**
 * Cached version of the Sections query for Master Data page.
 */
export const getCachedAdminSections = async () => {
    return unstable_cache(
        async () => {
            return db.section.findMany({
                orderBy: { name: 'asc' },
                include: {
                    _count: { select: { programs: true } }
                }
            });
        },
        ['admin-sections'],
        { tags: ['sections', 'programs'], revalidate: 3600 }
    )();
};

/**
 * Cached version of the Programs query for Master Data page.
 */
export const getCachedAdminPrograms = async () => {
    return unstable_cache(
        async () => {
            return db.program.findMany({
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    category: true,
                    targetGrades: true,
                    objectives: true,
                    sections: {
                        select: { id: true, name: true }
                    }
                }
            });
        },
        ['admin-programs'],
        { tags: ['programs', 'sections'], revalidate: 3600 }
    )();
};

/**
 * Cached version of the Employees query (Limited to latest 100) for Master Data page.
 */
export const getCachedAdminEmployees = async () => {
    return unstable_cache(
        async () => {
            return db.employee.findMany({
                take: 100,
                orderBy: { id: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    grade: true,
                    sectionName: true,
                    managerMobile: true
                }
            });
        },
        ['admin-employees-list'],
        { tags: ['employees'], revalidate: 3600 }
    )();
};

/**
 * Cached version of the Locations query for Master Data page.
 */
export const getCachedAdminLocations = async () => {
    return unstable_cache(
        async () => {
            return db.location.findMany({
                orderBy: { name: 'asc' }
            });
        },
        ['admin-locations'],
        { tags: ['locations'], revalidate: 3600 }
    )();
};
