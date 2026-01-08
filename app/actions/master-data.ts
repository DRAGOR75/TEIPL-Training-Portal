'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Grade, TrainingCategory } from '@prisma/client';

// --- SECTIONS ---
export async function createSection(formData: FormData) {
    const name = formData.get('name') as string;
    try {
        await db.section.create({ data: { name } });
        revalidatePath('/admin/tni-dashboard');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create section' };
    }
}

export async function deleteSection(id: string) {
    try {
        await db.section.delete({ where: { id } });
        revalidatePath('/admin/tni-dashboard');
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
                manager_name: formData.get('manager_name') as string,
                manager_email: formData.get('manager_email') as string,
            }
        });
        revalidatePath('/admin/tni-dashboard');
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
