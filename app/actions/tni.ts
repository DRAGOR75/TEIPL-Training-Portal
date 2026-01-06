'use server';
// Force recompile

import { db } from '@/lib/prisma';
import { Grade } from '@prisma/client'; // This might still error in editor until reload
import { redirect } from 'next/navigation';

export async function checkEmployeeAccess(formData: FormData) {
    const empId = formData.get('empId') as string;
    if (!empId) {
        // In server actions for forms, throwing error will trigger error boundary or fail request. 
        // Ideally we'd use useFormState, but for now throwing is better than returning object which breaks type.
        throw new Error('Employee ID is required');
    }

    // Check if employee exists
    // const employee = await db.employee.findUnique({ where: { id: empId } });

    // Redirect to the dynamic route regardless (creation happens there or next step)
    redirect(`/tni/${empId}`);
}

export async function getEmployeeProfile(empId: string) {
    const employee = await db.employee.findUnique({
        where: { id: empId },
        include: {
            nominations: {
                where: { createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } },
                include: { program: true }
            }
        }
    });

    // Fetch sections for the dropdown
    const sections = await db.section.findMany({
        orderBy: { name: 'asc' }
    });

    return { employee, sections };
}

export async function updateEmployeeProfile(empId: string, data: {
    name: string;
    email: string;
    grade: unknown; // Use unknown or string if Grade enum not picked up
    sectionName: string;
    location: string;
    manager_name?: string;
    manager_email?: string;
}) {
    try {
        const updated = await db.employee.upsert({
            where: { id: empId },
            update: {
                name: data.name,
                email: data.email,
                grade: data.grade as any, // Cast to any to avoid lint if enum missing
                sectionName: data.sectionName,
                location: data.location,
                manager_name: data.manager_name,
                manager_email: data.manager_email,
            },
            create: {
                id: empId,
                name: data.name,
                email: data.email,
                grade: data.grade as any,
                sectionName: data.sectionName,
                location: data.location,
                manager_name: data.manager_name,
                manager_email: data.manager_email,
            }
        });
        return { success: true, employee: updated };
    } catch (error) {
        console.error('Profile Update Error:', error);
        return { error: 'Failed to update profile' };
    }
}

export async function getAvailablePrograms() {
    return await db.program.findMany({
        orderBy: { name: 'asc' },
        include: { sections: true }
    });
}

export async function submitTNINomination(formData: FormData) {
    const empId = formData.get('empId') as string;
    const programId = formData.get('programId') as string;
    const justification = formData.get('justification') as string;

    if (!empId || !programId) {
        throw new Error("Employee ID and Program are required");
    }

    try {
        await db.nomination.create({
            data: {
                empId,
                programId,
                justification,
                status: 'Pending'
            }
        });

        // Revalidate the dashboard so the new nomination shows up
        // revalidatePath(`/tni/${empId}`); // This might need to be dynamic or we just redirect
    } catch (error) {
        console.error("Failed to submit nomination:", error);
        throw new Error("Failed to submit nomination");
    }

    redirect(`/tni/${empId}`);
}
