'use server';
// Force recompile

import { db } from '@/lib/prisma';
import { Grade } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'; // Added cache imports

export async function checkEmployeeAccess(formData: FormData) {
    const empId = formData.get('empId') as string;
    if (!empId) {
        throw new Error('Employee ID is required');
    }
    redirect(`/tni/${empId}`);
}

// CACHED: Employee Profile
export const getEmployeeProfile = unstable_cache(
    async (empId: string) => {
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
    },
    ['employee-profile'], // Base tag
    { revalidate: 3600, tags: ['employee-profile'] } // Revalidate every hour or on tag invalidation
);

export async function updateEmployeeProfile(empId: string, data: {
    name: string;
    email: string;
    grade: unknown;
    sectionName: string;
    location: string;
    mobile?: string;
    designation?: string;
    yearsOfExperience?: string;
    subDepartment?: string;
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
                mobile: data.mobile,
                designation: data.designation,
                yearsOfExperience: data.yearsOfExperience,
                subDepartment: data.subDepartment,
                managerName: data.managerName,
                managerEmail: data.managerEmail,
            },
            create: {
                id: empId, // Ensure ID is used for creation
                name: data.name,
                email: data.email,
                grade: data.grade as any,
                sectionName: data.sectionName,
                location: data.location,
                mobile: data.mobile,
                designation: data.designation,
                yearsOfExperience: data.yearsOfExperience,
                subDepartment: data.subDepartment,
                managerName: data.managerName,
                managerEmail: data.managerEmail,
            }
        });

        // revalidateTag('employee-profile'); // Removed due to build error
        revalidatePath(`/tni/${empId}`);
        return { success: true, employee: updated };
    } catch (error) {
        console.error('Profile Update Error:', error);
        return { error: 'Failed to update profile' };
    }
}

// CACHED: Available Programs
export const getAvailablePrograms = unstable_cache(
    async (grade?: Grade, sectionName?: string) => {
        const where: any = {
            AND: []
        };

        if (grade) {
            where.AND.push({ targetGrades: { has: grade } });
        }

        if (sectionName) {
            where.AND.push({
                OR: [
                    { category: { not: 'FUNCTIONAL' } },
                    {
                        category: 'FUNCTIONAL',
                        sections: { some: { name: sectionName } }
                    }
                ]
            });
        } else {
            where.AND.push({ category: { not: 'FUNCTIONAL' } });
        }

        return await db.program.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { sections: true }
        });
    },
    ['available-programs'],
    { revalidate: 86400, tags: ['programs'] } // Cache for 24h
);

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
