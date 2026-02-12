'use server';
// Force recompile

import { db } from '@/lib/prisma';
import { Grade, Gender } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { auth } from '@/auth';
import { verifySecureToken } from '@/lib/security';

export async function checkEmployeeAccess(formData: FormData) {
    const empId = formData.get('empId') as string;
    if (!empId || empId.length > 50) {
        throw new Error('Valid Employee ID is required (max 50 chars)');
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

        // Sort nominations by status: Approved > Pending > Rejected
        const priority: Record<string, number> = { 'Approved': 1, 'Pending': 2, 'Rejected': 3 };
        if (employee) {
            employee.nominations.sort((a, b) => (priority[a.status] || 99) - (priority[b.status] || 99));
        }

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
    gender?: string;
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
                name: data.name.substring(0, 100),
                email: data.email.substring(0, 100),
                grade: (() => {
                    if (!data.grade) throw new Error("Grade is required");
                    return data.grade as any;
                })(),
                sectionName: data.sectionName.substring(0, 100),
                location: data.location.substring(0, 100),
                gender: data.gender ? (data.gender.toUpperCase() as Gender) : null,
                mobile: data.mobile?.substring(0, 15),
                designation: data.designation?.substring(0, 100),
                yearsOfExperience: data.yearsOfExperience?.substring(0, 50),
                subDepartment: data.subDepartment?.substring(0, 100),
                managerName: data.managerName?.substring(0, 100),
                managerEmail: data.managerEmail?.substring(0, 100),
            },
            create: {
                id: empId.substring(0, 50),
                name: data.name.substring(0, 100),
                email: data.email.substring(0, 100),
                grade: data.grade as any,
                sectionName: data.sectionName.substring(0, 100),
                location: data.location.substring(0, 100),
                gender: data.gender ? (data.gender.toUpperCase() as Gender) : null,
                mobile: data.mobile?.substring(0, 15),
                designation: data.designation?.substring(0, 100),
                yearsOfExperience: data.yearsOfExperience?.substring(0, 50),
                subDepartment: data.subDepartment?.substring(0, 100),
                managerName: data.managerName?.substring(0, 100),
                managerEmail: data.managerEmail?.substring(0, 100),
            }
        });

        revalidateTag('employee-profile', 'max');
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

// CACHED: Manager Approval Data
export const getManagerApprovalData = unstable_cache(
    async (empId: string) => {
        const employee = await db.employee.findUnique({
            where: { id: empId },
            include: {
                nominations: {
                    where: { status: 'Pending' },
                    include: { program: true }
                }
            }
        });

        const priority: Record<string, number> = { 'Approved': 1, 'Pending': 2, 'Rejected': 3 };
        if (employee) {
            employee.nominations.sort((a, b) => (priority[a.status] || 99) - (priority[b.status] || 99));
        }

        return employee;
    },
    ['manager-approval-data'],
    { revalidate: 3600, tags: ['manager-approval'] } // Base tag, will be dynamic in usage if needed, but here we can just use a common tag pattern or rely on specific revalidation
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

    if (!empId || empId.length > 50 || programIds.length === 0) {
        throw new Error("Employee ID (max 50) and at least one Program are required");
    }

    const safeJustification = justification?.substring(0, 1000);

    try {
        // OPTIMIZATION: Use createMany to insert all records in a SINGLE database transaction.
        // This is much faster and reduces connection overhead compared to multiple individual creates.
        await db.nomination.createMany({
            data: programIds.map(programId => ({
                empId,
                programId,
                justification: safeJustification,
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
                safeJustification || 'No justification provided',
                empId
            );
        } else {
            console.warn(`Manager email not found for employee ${empId}, skipping email notification.`);
        }

        revalidateTag('employee-profile', 'max');
        revalidateTag('manager-approval', 'max');
    } catch (error) {
        console.error("Failed to submit nominations:", error);
        throw new Error("Failed to submit nominations");
    }

    redirect(`/tni/${empId}`);
}

export async function updateNominationStatus(nominationId: string, status: 'Approved' | 'Rejected', token?: string) {
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    // SECURITY CHECK: If NOT admin, must provide valid token matching nominationId or employee ID (context dependent)
    // For TNI Manager Approval, the token is signed against the ID in the URL.
    if (!isAdmin) {
        if (!token) return { success: false, error: 'Unauthorized' };

        // For TNI approval, the ID in the link is often the employee ID. 
        // Let's find the nomination to see who it belongs to.
        const nomination = await db.nomination.findUnique({
            where: { id: nominationId },
            select: { empId: true }
        });

        if (!nomination) return { error: 'Nomination not found' };

        // Verify token against nomination ID OR employee ID (to support both link types if needed)
        const isValid = verifySecureToken(token, nominationId) || verifySecureToken(token, nomination.empId);

        if (!isValid) return { success: false, error: 'Invalid or expired security token.' };
    }

    try {
        const updatedNomination = await db.nomination.update({
            where: { id: nominationId },
            data: {
                status,
                managerApprovalStatus: status // Sync manager status when admin updates main status
            },
            select: { empId: true } // Fetch empId to revalidate specific dashboard
        });

        // Revalidate the Manager Approval Page (where the action happened)
        revalidatePath(`/nominations/manager/${updatedNomination.empId}`);

        // Revalidate the Employee's Dashboard (so they see the change)
        revalidatePath(`/tni/${updatedNomination.empId}`);

        // Invalidate the cache for the profile fetcher
        revalidateTag('employee-profile', 'max');

        // Invalidate the manager approval cache
        revalidateTag('manager-approval', 'max');

        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: 'Failed to update status' };
    }
}
