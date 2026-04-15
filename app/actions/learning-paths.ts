'use server';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
const MANUAL_PATH = '/training-manuals';
// --- 1. Learning Path CRUD ---
export async function createLearningPath(data: { name: string; description?: string; groupName: string }) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        if (!data.name?.trim()) return { error: 'Path name is required' };
        if (!data.groupName?.trim()) return { error: 'Group name is required' };
        await db.learningPath.create({
            data: {
                name: data.name.trim(),
                description: data.description?.trim() || null,
                groupName: data.groupName.trim(),
            }
        });
        revalidatePath(MANUAL_PATH);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2002') return { error: 'A learning path with this name already exists.' };
        return { error: 'Failed to create learning path' };
    }
}
export async function updateLearningPath(id: string, data: { name?: string; description?: string; groupName?: string; status?: string }) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.learningPath.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name.trim() }),
                ...(data.description !== undefined && { description: data.description.trim() || null }),
                ...(data.groupName !== undefined && { groupName: data.groupName.trim() }),
                ...(data.status !== undefined && { status: data.status }),
            }
        });
        revalidatePath(MANUAL_PATH);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2002') return { error: 'A learning path with this name already exists.' };
        return { error: 'Failed to update learning path' };
    }
}
export async function deleteLearningPath(id: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.learningPath.delete({ where: { id } });
        revalidatePath(MANUAL_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to delete learning path' };
    }
}
// --- 2. Subject Assignment ---
export async function addSubjectToPath(pathId: string, subjectId: number, seq: number) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.learningPathSubject.create({
            data: { learningPathId: pathId, subjectId, seq }
        });
        revalidatePath(MANUAL_PATH);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2002') return { error: 'This subject is already in the learning path.' };
        return { error: 'Failed to add subject to path' };
    }
}
export async function removeSubjectFromPath(id: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.learningPathSubject.delete({ where: { id } });
        revalidatePath(MANUAL_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to remove subject from path' };
    }
}
export async function reorderPathSubjects(items: { id: string; seq: number }[]) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.$transaction(
            items.map((item) =>
                db.learningPathSubject.update({
                    where: { id: item.id },
                    data: { seq: item.seq }
                })
            )
        );
        revalidatePath(MANUAL_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to reorder subjects' };
    }
}
// --- 3. Fetchers ---
export async function getLearningPaths() {
    try {
        const paths = await db.learningPath.findMany({
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
        return { success: true, data: paths };
    } catch (e) {
        console.error('Error fetching learning paths:', e);
        return { success: false, error: 'Failed to fetch learning paths' };
    }
}
export async function getLearningPathsForGroup(groupName: string) {
    try {
        const paths = await db.learningPath.findMany({
            where: { groupName, status: 'Active' },
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
        return { success: true, data: paths };
    } catch (e) {
        console.error('Error fetching paths for group:', e);
        return { success: false, error: 'Failed to fetch learning paths' };
    }
}