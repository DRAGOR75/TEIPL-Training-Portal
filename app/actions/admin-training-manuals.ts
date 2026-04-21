'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const ADMIN_PATH = '/training-manuals';

// --- 1. Subject Management ---

export async function createManualSubject(formData: FormData) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        const name = formData.get('name') as string;
        const viewSeq = parseInt(formData.get('viewSeq') as string) || 99;

        if (!name) return { error: 'Subject Name is required' };

        await db.manualSubject.create({
            data: { name, viewSeq }
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2002') {
            return { error: 'Subject with this name already exists.' };
        }
        return { error: 'Failed to create subject' };
    }
}

export async function deleteManualSubject(id: number) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.$transaction(async (tx) => {
            // Delete mappings first
            await tx.subjectModule.deleteMany({
                where: { subjectId: id }
            });

            // Delete the subject
            await tx.manualSubject.delete({
                where: { id }
            });
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error('Delete subject error:', e);
        return { error: 'Failed to delete subject. It may still have dependencies.' };
    }
}

export async function updateManualSubject(id: number, data: { name: string; viewSeq: number }) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        if (!data.name) return { error: 'Subject Name is required' };

        await db.manualSubject.update({
            where: { id },
            data: {
                name: data.name,
                viewSeq: data.viewSeq
            }
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2002') {
            return { error: 'Subject with this name already exists.' };
        }
        return { error: 'Failed to update subject' };
    }
}

export async function toggleManualSubjectStatus(id: number, currentStatus: number) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        const newStatus = currentStatus === 1 ? 0 : 1;
        await db.manualSubject.update({
            where: { id },
            data: { userView: newStatus }
        });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to update subject status' };
    }
}

// --- 2. Module Library Management ---

export async function createManualModule(formData: FormData) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        const name = formData.get('name') as string;
        const moduleCode = formData.get('moduleCode') as string || null;

        if (!name) return { error: 'Module Name is required' };

        await db.manualModule.create({
            data: { name, moduleCode }
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to create module' };
    }
}

export async function deleteManualModule(id: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.manualModule.delete({ where: { id } });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to delete module' };
    }
}

// --- 3. Topic Library Management ---

export async function createManualTopic(formData: FormData) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        const name = formData.get('name') as string;
        const content = formData.get('content') as string || '';
        const pdfUrl = formData.get('pdfUrl') as string || '';
        const manualRef = formData.get('manualRef') as string || '';

        if (!name) return { error: 'Topic Name is required' };

        await db.manualTopic.create({
            data: { name, content, pdfUrl, manualRef }
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to create topic' };
    }
}

export async function updateManualTopic(id: string, data: { name: string; content?: string; pdfUrl: string; manualRef: string }) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        if (!data.name) return { error: 'Topic Name is required' };

        await db.manualTopic.update({
            where: { id },
            data: {
                name: data.name,
                content: data.content,
                pdfUrl: data.pdfUrl,
                manualRef: data.manualRef
            }
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to update topic' };
    }
}

// --- 4. Subject <-> Module Linking ---

export async function linkModuleToSubject(subjectId: number, moduleId: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.subjectModule.create({
            data: {
                subjectId,
                moduleId
            }
        });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to link module' };
    }
}

export async function unlinkModuleFromSubject(subjectModuleId: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.subjectModule.delete({ where: { id: subjectModuleId } });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to unlink module' };
    }
}

// --- 5. Topic Sequencing (Module <-> Topic) ---

export async function addTopicToModule(subjectModuleId: string, topicId: string, seq: number) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.moduleTopic.create({
            data: {
                subjectModuleId,
                topicId,
                seq
            }
        });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to add topic to module' };
    }
}

export async function removeTopicFromModule(id: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.moduleTopic.delete({ where: { id } });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to remove topic' };
    }
}

export async function updateTopicSequenceOrder(items: { id: string; seq: number }[]) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.$transaction(
            items.map((item) =>
                db.moduleTopic.update({
                    where: { id: item.id },
                    data: { seq: item.seq }
                })
            )
        );
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to reorder topics' };
    }
}

// --- 6. Unified UI Helpers ---

export async function createAndLinkModuleToSubject(subjectId: number, moduleName: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        if (!moduleName.trim()) return { error: 'Module Name is required' };
        
        await db.$transaction(async (tx) => {
            const newModule = await tx.manualModule.create({
                data: { name: moduleName.trim() }
            });
            await tx.subjectModule.create({
                data: {
                    subjectId,
                    moduleId: newModule.id
                }
            });
        });
        
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2002') {
             return { error: 'A module with this name already exists in the library.' };
        }
        return { error: 'Failed to create and link module' };
    }
}

export async function createAndLinkTopicToModule(subjectModuleId: string, topicName: string, seq: number) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        if (!topicName.trim()) return { error: 'Topic Name is required' };
        
        await db.$transaction(async (tx) => {
            const newTopic = await tx.manualTopic.create({
                data: { name: topicName.trim() }
            });
            await tx.moduleTopic.create({
                data: {
                    subjectModuleId,
                    topicId: newTopic.id,
                    seq
                }
            });
        });
        
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to create and link topic' };
    }
}

// --- Fetchers ---

export async function getAdminManualData() {
    const subjects = await db.manualSubject.findMany({ orderBy: { viewSeq: 'asc' } });
    const moduleLib = await db.manualModule.findMany({ orderBy: { viewSeq: 'asc' } });
    const topicLib = await db.manualTopic.findMany({ orderBy: { name: 'asc' } });

    return { subjects, moduleLib, topicLib };
}

