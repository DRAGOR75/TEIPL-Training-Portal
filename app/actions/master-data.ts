'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { Grade, TrainingCategory, Gender } from '@prisma/client';
import { auth } from '@/auth';
import { sanitizeInput } from '@/lib/security';

// --- SECTIONS ---
export async function createSection(formData: FormData) {
    if (!await auth()) return { error: 'Unauthorized' };
    const name = sanitizeInput(formData.get('name') as string);
    try {
        await db.section.create({ data: { name } });
        revalidateTag('sections', 'max');
        revalidateTag('tni-reports', 'max');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create section' };
    }
}

export async function deleteSection(id: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.section.delete({ where: { id } });
        revalidateTag('sections', 'max');
        revalidateTag('tni-reports', 'max');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete section' };
    }
}

// --- PROGRAMS ---
export async function createProgram(formData: FormData) {
    if (!await auth()) return { error: 'Unauthorized' };
    const name = sanitizeInput(formData.get('name') as string);
    const category = formData.get('category') as TrainingCategory;
    const grades = formData.getAll('targetGrades') as Grade[];
    const sectionIds = formData.getAll('sectionIds') as string[];
    
    // Extended fields
    const objectives = sanitizeInput(formData.get('objectives') as string);
    const machineModel = sanitizeInput(formData.get('machineModel') as string);
    const status = sanitizeInput(formData.get('status') as string) || 'Active';
    const materialPriority = sanitizeInput(formData.get('materialPriority') as string);
    const contentResp = sanitizeInput(formData.get('contentResp') as string);
    const targetDate = sanitizeInput(formData.get('targetDate') as string);
    const syllabusLink = sanitizeInput(formData.get('syllabusLink') as string);
    const trainerMaterial = sanitizeInput(formData.get('trainerMaterial') as string);
    const participantMaterial = sanitizeInput(formData.get('participantMaterial') as string);
    const level = sanitizeInput(formData.get('level') as string);
    
    const daysStr = formData.get('days') as string;
    const days = daysStr && !isNaN(parseFloat(daysStr)) ? parseFloat(daysStr) : null;

    try {
        await db.program.create({
            data: {
                name,
                category,
                targetGrades: grades,
                objectives: objectives || null,
                machineModel: machineModel || null,
                status: status,
                materialPriority: materialPriority || null,
                contentResp: contentResp || null,
                targetDate: targetDate || null,
                syllabusLink: syllabusLink || null,
                trainerMaterial: trainerMaterial || null,
                participantMaterial: participantMaterial || null,
                level: level || null,
                days: days,
                sections: {
                    connect: sectionIds.map(id => ({ id }))
                }
            }
        });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('programs', 'max');
        revalidateTag('available-programs', 'max');
        revalidateTag('tni-reports', 'max');
        return { success: true };
    } catch (error) {
        console.error("Program Create Error", error);
        return { error: 'Failed to create program' };
    }
}

export async function deleteProgram(id: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.program.delete({ where: { id } });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('programs', 'max');
        revalidateTag('available-programs', 'max');
        revalidateTag('tni-reports', 'max');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete program' };
    }
}

export async function updateProgram(programId: string, formData: FormData) {
    if (!await auth()) return { error: 'Unauthorized' };
    
    const name = sanitizeInput(formData.get('name') as string);
    const category = formData.get('category') as TrainingCategory;
    const grades = formData.getAll('targetGrades') as Grade[];
    const sectionIds = formData.getAll('sectionIds') as string[];
    
    // Extended fields
    const objectives = sanitizeInput(formData.get('objectives') as string);
    const machineModel = sanitizeInput(formData.get('machineModel') as string);
    const status = sanitizeInput(formData.get('status') as string) || 'Active';
    const materialPriority = sanitizeInput(formData.get('materialPriority') as string);
    const contentResp = sanitizeInput(formData.get('contentResp') as string);
    const targetDate = sanitizeInput(formData.get('targetDate') as string);
    const syllabusLink = sanitizeInput(formData.get('syllabusLink') as string);
    const trainerMaterial = sanitizeInput(formData.get('trainerMaterial') as string);
    const participantMaterial = sanitizeInput(formData.get('participantMaterial') as string);
    const level = sanitizeInput(formData.get('level') as string);
    
    const daysStr = formData.get('days') as string;
    const days = daysStr && !isNaN(parseFloat(daysStr)) ? parseFloat(daysStr) : null;

    try {
        await db.program.update({
            where: { id: programId },
            data: {
                name,
                category,
                targetGrades: grades,
                objectives: objectives || null,
                machineModel: machineModel || null,
                status: status,
                materialPriority: materialPriority || null,
                contentResp: contentResp || null,
                targetDate: targetDate || null,
                syllabusLink: syllabusLink || null,
                trainerMaterial: trainerMaterial || null,
                participantMaterial: participantMaterial || null,
                level: level || null,
                days: days,
                sections: {
                    set: sectionIds.map(id => ({ id }))
                }
            }
        });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('programs', 'max');
        revalidateTag('available-programs', 'max');
        revalidateTag('tni-reports', 'max');
        return { success: true };
    } catch (error) {
        console.error("Update Program Error", error);
        return { error: 'Failed to update program' };
    }
}

export async function toggleProgramStatus(id: string, currentStatus: string | null) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        const newStatus = (currentStatus === 'Active' || !currentStatus) ? 'Inactive' : 'Active';
        await db.program.update({
            where: { id },
            data: { status: newStatus }
        });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('programs', 'max');
        revalidateTag('available-programs', 'max');
        return { success: true, newStatus };
    } catch (error) {
        return { error: 'Failed to toggle status' };
    }
}

// --- EMPLOYEES (Single) ---
export async function createEmployee(formData: FormData) {
    if (!await auth()) return { error: 'Unauthorized' };
    const empId = formData.get('id') as string;
    try {
        await db.employee.create({
            data: {
                id: sanitizeInput(empId),
                name: sanitizeInput(formData.get('name') as string),
                email: sanitizeInput(formData.get('email') as string),
                grade: (() => {
                    const g = formData.get('grade') as string;
                    if (!g) throw new Error("Grade is required");
                    return g as Grade;
                })(),
                sectionName: formData.get('sectionName') as string,
                location: formData.get('location') as string,
                gender: (() => {
                    const g = formData.get('gender') as string;
                    if (!g) return null;
                    return g.toUpperCase() as Gender;
                })(),
                managerName: sanitizeInput(formData.get('managerName') as string),
                managerEmail: sanitizeInput(formData.get('managerEmail') as string),
                managerMobile: sanitizeInput(formData.get('managerMobile') as string),
                designation: sanitizeInput(formData.get('designation') as string),
                doj: formData.get('doj') ? new Date(formData.get('doj') as string) : undefined,
                dob: formData.get('dob') ? new Date(formData.get('dob') as string) : undefined,
            }
        });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('employee-profile', 'max');
        revalidateTag('tni-reports', 'max');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create employee (ID or Email might exist)' };
    }
}

export async function deleteEmployee(id: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.employee.delete({ where: { id } });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('tni-reports', 'max');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete employee' };
    }
}

export async function updateEmployee(id: string, formData: FormData) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.employee.update({
            where: { id },
            data: {
                name: sanitizeInput(formData.get('name') as string),
                email: sanitizeInput(formData.get('email') as string),
                grade: (() => {
                    const g = formData.get('grade') as string;
                    if (!g) throw new Error("Grade is required");
                    return g as Grade;
                })(),
                sectionName: formData.get('sectionName') as string,
                location: formData.get('location') as string,
                gender: (() => {
                    const g = formData.get('gender') as string;
                    if (!g) return null;
                    return g.toUpperCase() as Gender;
                })(),
                managerName: sanitizeInput(formData.get('managerName') as string) || null,
                managerEmail: sanitizeInput(formData.get('managerEmail') as string) || null,
                managerMobile: sanitizeInput(formData.get('managerMobile') as string) || null,
                designation: sanitizeInput(formData.get('designation') as string) || null,
                doj: formData.get('doj') ? new Date(formData.get('doj') as string) : null,
                dob: formData.get('dob') ? new Date(formData.get('dob') as string) : null,
            }
        });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('employee-profile', 'max');
        revalidateTag('tni-reports', 'max');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update employee' };
    }
}

// --- LOCATIONS ---
export async function createLocation(formData: FormData) {
    if (!await auth()) return { error: 'Unauthorized' };
    const name = sanitizeInput(formData.get('name') as string);
    try {
        await db.location.create({ data: { name } });
        revalidatePath('/admin/tni-dashboard');
        revalidateTag('locations', 'max');
        revalidateTag('tni-reports', 'max');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create location' };
    }
}

export async function deleteLocation(id: string) {
    if (!await auth()) return { error: 'Unauthorized' };
    try {
        await db.location.delete({ where: { id } });
        revalidateTag('locations', 'max');
        revalidateTag('tni-reports', 'max');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete location' };
    }
}

// --- FETCH HELPERS (Proper Server Actions) ---
const getCachedSections = unstable_cache(
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

export async function getSections() {
    return await getCachedSections();
}

const getCachedDesignations = unstable_cache(
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

export async function getDesignations() {
    return await getCachedDesignations();
}

const getCachedLocations = unstable_cache(
    async () => {
        try {
            console.log("Fetching locations from DB for cache...");
            const locations = await db.location.findMany({
                select: { name: true },
                orderBy: { name: 'asc' }
            });
            console.log(`Found ${locations.length} locations`);
            return locations.map(l => ({ label: l.name, value: l.name }));
        } catch (error) {
            console.error("Fetch Locations Error:", error);
            return [];
        }
    },
    ['locations-options'],
    { revalidate: 86400, tags: ['locations'] }
);

export async function getLocations() {
    return await getCachedLocations();
}

const getCachedTrainerOptions = unstable_cache(
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

export async function getTrainerOptions() {
    return await getCachedTrainerOptions();
}
