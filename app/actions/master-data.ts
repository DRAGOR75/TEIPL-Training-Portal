'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { Grade, TrainingCategory } from '@prisma/client';

// --- SECTIONS ---
export async function createSection(formData: FormData) {
    const name = formData.get('name') as string;
    try {
        await db.section.create({ data: { name } });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('sections', 'default');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create section' };
    }
}

export async function deleteSection(id: string) {
    try {
        await db.section.delete({ where: { id } });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('sections', 'default');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete section' };
    }
}

// --- PROGRAMS ---
export async function createProgram(formData: FormData) {
    const name = formData.get('name') as string;
    const category = formData.get('category') as TrainingCategory;
    const grades = formData.getAll('targetGrades') as Grade[];
    const sectionIds = formData.getAll('sectionIds') as string[];

    try {
        await db.program.create({
            data: {
                name,
                category,
                targetGrades: grades,
                sections: {
                    connect: sectionIds.map(id => ({ id }))
                }
            }
        });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('programs', 'default');
        revalidateTag('available-programs', 'default');
        return { success: true };
    } catch (error) {
        console.error("Program Create Error", error);
        return { error: 'Failed to create program' };
    }
}

export async function deleteProgram(id: string) {
    try {
        await db.program.delete({ where: { id } });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('programs', 'default');
        revalidateTag('available-programs', 'default');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete program' };
    }
}

export async function updateProgramSections(programId: string, sectionIds: string[]) {
    try {
        await db.program.update({
            where: { id: programId },
            data: {
                sections: {
                    set: sectionIds.map(id => ({ id }))
                }
            }
        });
        revalidatePath('/admin/tni-dashboard');
        return { success: true };
    } catch (error) {
        console.error("Update Program Sections Error", error);
        return { error: 'Failed to update program sections' };
    }
}

// --- EMPLOYEES (Single) ---
export async function createEmployee(formData: FormData) {
    const empId = formData.get('id') as string;
    try {
        await db.employee.create({
            data: {
                id: empId,
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                grade: (() => {
                    const g = formData.get('grade') as string;
                    if (!g) throw new Error("Grade is required");
                    return g as Grade;
                })(),
                sectionName: formData.get('sectionName') as string,
                location: formData.get('location') as string,
                managerName: formData.get('manager_name') as string,
                managerEmail: formData.get('manager_email') as string,
            }
        });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('employee-profile', 'default'); // Invalidate generic profile cache if needed
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create employee (ID or Email might exist)' };
    }
}

export async function deleteEmployee(id: string) {
    try {
        await db.employee.delete({ where: { id } });
        revalidatePath('/admin/tni-dashboard');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete employee' };
    }
}

// --- FETCH HELPERS (For Searchable Selects) ---
export const getSections = unstable_cache(
    async () => {
        try {
            const sections = await db.section.findMany({
                orderBy: { name: 'asc' },
                select: { name: true }
            });
            return sections.map(s => ({ label: s.name, value: s.name }));
        } catch (error) {
            return [];
        }
    },
    ['sections-options'],
    { revalidate: 86400, tags: ['sections'] }
);

export const getDesignations = unstable_cache(
    async () => {
        try {
            const designations = await db.designation.findMany({
                select: { name: true },
                orderBy: { name: 'asc' }
            });
            return designations.map(d => ({ label: d.name, value: d.name }));
        } catch (error) {
            return [];
        }
    },
    ['designations-options'],
    { revalidate: 86400, tags: ['designations'] }
);

export const getLocations = unstable_cache(
    async () => {
        try {
            const locations = await db.location.findMany({
                select: { name: true },
                orderBy: { name: 'asc' }
            });
            return locations.map(l => ({ label: l.name, value: l.name }));
        } catch (error) {
            return [];
        }
    },
    ['locations-options'],
    { revalidate: 86400, tags: ['locations'] }
);

export const getTrainerOptions = unstable_cache(
    async () => {
        try {
            const trainers = await db.trainer.findMany({
                select: { name: true },
                orderBy: { name: 'asc' }
            });
            return trainers.map(t => ({ label: t.name, value: t.name }));
        } catch (error) {
            return [];
        }
    },
    ['trainers-options'],
    { revalidate: 86400, tags: ['trainers'] }
);
