'use server';

import { db } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

export interface ProgramRecord {
    programGroup: string;
    subjectCode: string;
    trainingName: string;
    status: string;
    forSection: string;
    sectionCodeName: string;
    days?: number | null;
    targetGrades?: string[];
    targetDate?: string;
    contentResp?: string;
    participantMaterial?: string;
    trainerMaterial?: string;
    syllabusLink?: string;
    objectives?: string;
    materialPriority?: string;
    machineModel?: string;
    level?: string;
}

const mapCategory = (group: string) => {
    const normalized = group.trim().toLowerCase();
    if (normalized.includes('hemm')) return 'HEMM_PROGRAMS'; // UI displays as HEMM Programs
    if (normalized.includes('safety')) return 'SAFETY_PROGRAMS'; // UI displays as Safety
    if (normalized.includes('other')) return 'OTHER_PROGRAMS'; // UI displays as Other
    if (normalized.includes('behav')) return 'BEHAVIOURAL_PROGRAMS';
    return 'OTHER_PROGRAMS'; // default
};

export async function processProgramBatch(records: ProgramRecord[]) {
    try {
        for (const record of records) {
            if (!record.subjectCode || !record.trainingName) continue;

            const category = mapCategory(record.programGroup);

            // 1. Handle Section (Department) creation if provided
            let sectionId = null;
            if (record.forSection && record.forSection.trim()) {
                const sectionName = record.forSection.trim();
                let section = await db.section.findUnique({
                    where: { name: sectionName }
                });

                if (!section) {
                    section = await db.section.create({
                        data: { name: sectionName }
                    });
                }
                sectionId = section.id;
            }

            // 2. Upsert Program
            const programData = {
                id: record.subjectCode.trim(), // Use custom string ID
                name: record.trainingName.trim(),
                category: category as any, // Cast to any to satisfy Prisma enum type locally
                sectionCodeName: record.sectionCodeName || null,
                status: record.status || 'Active',
                days: record.days ?? null,
                targetGrades: record.targetGrades && record.targetGrades.length > 0 ? record.targetGrades : ['EXECUTIVE', 'WORKMAN'], // default to both if empty
                targetDate: record.targetDate || null,
                contentResp: record.contentResp || null,
                participantMaterial: record.participantMaterial || null,
                trainerMaterial: record.trainerMaterial || null,
                syllabusLink: record.syllabusLink || null,
                objectives: record.objectives || null,
                materialPriority: record.materialPriority || null,
                machineModel: record.machineModel || null,
                level: record.level || null,
            };

            const existingProgram = await db.program.findUnique({
                where: { id: programData.id }
            });

            if (existingProgram) {
                // Partial Update: Only overwrite fields that are explicitly provided
                const updateData: any = {};
                if (record.trainingName) updateData.name = programData.name;
                if (record.programGroup) updateData.category = programData.category;
                if (record.sectionCodeName) updateData.sectionCodeName = programData.sectionCodeName;
                if (record.status) updateData.status = programData.status;
                if (record.days !== undefined) updateData.days = programData.days;
                if (record.targetGrades && record.targetGrades.length > 0) updateData.targetGrades = programData.targetGrades;
                if (record.targetDate) updateData.targetDate = programData.targetDate;
                if (record.contentResp) updateData.contentResp = programData.contentResp;
                if (record.participantMaterial) updateData.participantMaterial = programData.participantMaterial;
                if (record.trainerMaterial) updateData.trainerMaterial = programData.trainerMaterial;
                if (record.syllabusLink) updateData.syllabusLink = programData.syllabusLink;
                if (record.objectives) updateData.objectives = programData.objectives;
                if (record.materialPriority) updateData.materialPriority = programData.materialPriority;
                if (record.machineModel) updateData.machineModel = programData.machineModel;
                if (record.level) updateData.level = programData.level;
                if (sectionId) updateData.sections = { connect: { id: sectionId } };

                if (Object.keys(updateData).length > 0) {
                    await db.program.update({
                        where: { id: programData.id },
                        data: updateData
                    });
                }
            } else {
                // For new creations, it must have a name
                if (!record.trainingName) continue;
                await db.program.create({
                    data: {
                        ...programData,
                        targetGrades: programData.targetGrades as any, // Cast for Prisma enum
                        ...(sectionId ? { sections: { connect: { id: sectionId } } } : {})
                    }
                });
            }
        }

        revalidateTag('programs', 'max');
        revalidateTag('admin-programs', 'max');
        revalidateTag('sections', 'max');
        revalidateTag('admin-sections', 'max');

        return { success: true };
    } catch (error: any) {
        console.error('Batch Program Upload Error:', error);
        return { success: false, error: error.message };
    }
}

export async function clearProgramCatalog() {
    try {
        // Delete all programs. This will cascade and delete any nominations linked to them.
        const result = await db.program.deleteMany({});
        
        revalidateTag('programs', 'max');
        revalidateTag('admin-programs', 'max');
        
        return { success: true, count: result.count };
    } catch (error: any) {
        console.error('Failed to clear programs:', error);
        return { success: false, error: error.message || 'Failed to clear program catalog' };
    }
}
