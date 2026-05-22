'use server';

import { db } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

export interface ProgramRecord {
    programGroup: string;
    subjectCode: string;
    trainingName: string;
    status: string;
    forSection: string;
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
            };

            const existingProgram = await db.program.findUnique({
                where: { id: programData.id }
            });

            if (existingProgram) {
                await db.program.update({
                    where: { id: programData.id },
                    data: {
                        name: programData.name,
                        category: programData.category,
                        ...(sectionId ? { sections: { connect: { id: sectionId } } } : {})
                    }
                });
            } else {
                await db.program.create({
                    data: {
                        ...programData,
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
