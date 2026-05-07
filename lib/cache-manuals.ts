import { db } from './prisma';
import { unstable_cache } from 'next/cache';

/**
 * Cached version of the Manual Subjects query.
 * Revalidates when the 'manuals' tag is invalidated.
 */
export const getCachedManualSubjects = async (isAdmin: boolean) => {
    return unstable_cache(
        async () => {
            const whereClause = isAdmin ? undefined : { userView: 1 };
            return db.manualSubject.findMany({
                where: whereClause,
                orderBy: { viewSeq: 'asc' },
            });
        },
        [`manual-subjects-${isAdmin}`],
        { tags: ['manuals'], revalidate: 3600 } // Cache for 1 hour, or until manual revalidation
    )();
};

/**
 * Cached version of the full Manual Tree (subjects -> modules -> topics).
 */
export const getCachedManualTree = async (isAdmin: boolean) => {
    return unstable_cache(
        async () => {
            const whereClause = isAdmin ? undefined : { userView: 1 };
            return db.manualSubject.findMany({
                where: whereClause,
                orderBy: { viewSeq: 'asc' },
                include: {
                    subjectModules: {
                        orderBy: { viewSeq: 'asc' },
                        include: {
                            module: true,
                            topics: {
                                where: { isActive: true },
                                orderBy: { seq: 'asc' },
                                include: {
                                    topic: true
                                }
                            }
                        }
                    }
                }
            });
        },
        [`manual-tree-${isAdmin}`],
        { tags: ['manuals'], revalidate: 3600 }
    )();
};

/**
 * Cached version of the Module Library.
 */
export const getCachedModuleLib = async () => {
    return unstable_cache(
        async () => {
            return db.manualModule.findMany({ orderBy: { viewSeq: 'asc' } });
        },
        ['manual-module-lib'],
        { tags: ['manuals'], revalidate: 3600 }
    )();
};

/**
 * Cached version of the Topic Library.
 */
export const getCachedTopicLib = async () => {
    return unstable_cache(
        async () => {
            return db.manualTopic.findMany({ orderBy: { name: 'asc' } });
        },
        ['manual-topic-lib'],
        { tags: ['manuals'], revalidate: 3600 }
    )();
};

/**
 * Cached version of Learning Paths.
 */
export const getCachedLearningPaths = async (isAdmin: boolean) => {
    return unstable_cache(
        async () => {
            try {
                return db.learningPath.findMany({
                    ...(isAdmin ? {} : { where: { status: 'Active' } }),
                    orderBy: { createdAt: 'desc' },
                    include: {
                        subjects: {
                            orderBy: { seq: 'asc' },
                            include: {
                                subject: {
                                    select: { id: true, name: true, imageUrl: true, keywords: true }
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.warn('Learning path tables not yet created:', e);
                return [];
            }
        },
        [`learning-paths-${isAdmin}`],
        { tags: ['manuals', 'learning-paths'], revalidate: 3600 }
    )();
};
