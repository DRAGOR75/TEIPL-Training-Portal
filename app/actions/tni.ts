'use server';
// Force recompile

import { db } from '@/lib/prisma';
import { Grade } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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
    managerName?: string;
    managerEmail?: string;
}) {
    try {
        const updated = await db.employee.upsert({
            where: { id: empId },
            update: {
                name: data.name,
                email: data.email,
                grade: (() => {
                    if (!data.grade) throw new Error("Grade is required");
                    return data.grade as any;
                })(),
                sectionName: data.sectionName,
                location: data.location,
                managerName: data.managerName,
                managerEmail: data.managerEmail,
            },
            create: {
                id: empId,
                name: data.name,
                email: data.email,
                grade: data.grade as any,
                sectionName: data.sectionName,
                location: data.location,
                managerName: data.managerName,
                managerEmail: data.managerEmail,
            }
        });
        revalidatePath(`/tni/${empId}`);
        return { success: true, employee: updated };
    } catch (error) {
        console.error('Profile Update Error:', error);
        return { error: 'Failed to update profile' };
    }
}

export async function getAvailablePrograms(grade?: Grade, sectionName?: string) {
    const where: any = {
        AND: []
    };

    // 1. Filter by Grade (Universal)
    if (grade) {
        where.AND.push({ targetGrades: { has: grade } });
    }

    // 2. Filter Functional Programs by Section
    // If category is FUNCTIONAL, it must match the section.
    // Other categories are shown regardless of section (for now).
    if (sectionName) {
        where.AND.push({
            OR: [
                { category: { not: 'FUNCTIONAL' } }, // Show Non-Functional
                {
                    category: 'FUNCTIONAL',
                    sections: { some: { name: sectionName } } // Only matching Section
                }
            ]
        });
    } else {
        // If no section is assigned to employee, maybe hide all Functional? or show none?
        // Let's hide Functional programs if user has no section to be safe, 
        // to avoid showing them everything.
        where.AND.push({ category: { not: 'FUNCTIONAL' } });
    }

    return await db.program.findMany({
        where,
        orderBy: { name: 'asc' },
        include: { sections: true }
    });
}

import { sendTNIApprovalEmail } from '@/lib/email';

export async function submitTNINomination(formData: FormData) {
    const empId = formData.get('empId') as string;
    const justification = formData.get('justification') as string;

    // Collect all selected program IDs
    const programIds: string[] = [];

    const p1 = formData.get('programId_FOUNDATIONAL') as string;
    if (p1) programIds.push(p1);

    const p2 = formData.get('programId_FUNCTIONAL') as string;
    if (p2) programIds.push(p2);

    const p3 = formData.get('programId_BEHAVIOURAL') as string;
    if (p3) programIds.push(p3);

    const p4 = formData.get('programId_COMMON') as string;
    if (p4) programIds.push(p4);

    if (!empId || programIds.length === 0) {
        throw new Error("Employee ID and at least one Program are required");
    }

    try {
        // OPTIMIZATION: Use createMany to insert all records in a SINGLE database transaction.
        // This is much faster and reduces connection overhead compared to multiple individual creates.
        await db.nomination.createMany({
            data: programIds.map(programId => ({
                empId,
                programId,
                justification,
                status: 'Pending'
            }))
        });


        // 1. Fetch Employee Details to get Manager Email & Name
        const employee = await db.employee.findUnique({
            where: { id: empId },
            select: { name: true, managerEmail: true, managerName: true }
        });

        if (employee && employee.managerEmail) {
            // 2. Fetch Program Names for the email
            const programs = await db.program.findMany({
                where: { id: { in: programIds } },
                select: { name: true }
            });
            const programNames = programs.map(p => p.name);

            // 3. Send the single consolidated email
            await sendTNIApprovalEmail(
                employee.managerEmail,
                employee.managerName || 'Manager',
                employee.name,
                programNames,
                justification,
                empId
            );
        } else {
            console.warn(`Manager email not found for employee ${empId}, skipping email notification.`);
        }

        // Revalidate is implicit if we redirect, or we can assume next refresh picks it up
    } catch (error) {
        console.error("Failed to submit nominations:", error);
        throw new Error("Failed to submit nominations");
    }

    redirect(`/tni/${empId}`);
}

export async function updateNominationStatus(nominationId: string, status: 'Approved' | 'Rejected') {
    try {
        await db.nomination.update({
            where: { id: nominationId },
            data: { status }
        });
        revalidatePath('/nominations/manager/[empId]');
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: 'Failed to update status' };
    }
}
