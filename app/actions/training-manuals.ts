'use server';

import { db } from '@/lib/prisma';

export async function getManualSubjects() {
    try {
        const subjects = await db.manualSubject.findMany({
            where: { userView: 1 },
            orderBy: { viewSeq: 'asc' },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                keywords: true
            }
        });
        return { success: true, data: subjects };
    } catch (e) {
        console.error('Error fetching subjects:', e);
        return { success: false, error: 'Database connection failed' };
    }
}

export async function getManualModules(subjectId: number) {
    try {
        const subjectModules = await db.subjectModule.findMany({
            where: { subjectId },
            include: {
                module: true
            },
            orderBy: { viewSeq: 'asc' }
        });
        return { success: true, data: subjectModules };
    } catch (e) {
        console.error('Error fetching modules:', e);
        return { success: false, error: 'Failed to fetch modules' };
    }
}

export async function getModuleTopicSequence(subjectModuleId: string) {
    try {
        const sequence = await db.moduleTopic.findMany({
            where: { 
                subjectModuleId,
                isActive: true
            },
            include: {
                topic: true
            },
            orderBy: { seq: 'asc' }
        });
        return { success: true, data: sequence };
    } catch (e) {
        console.error('Error fetching topic sequence:', e);
        return { success: false, error: 'Failed to fetch topic sequence' };
    }
}
