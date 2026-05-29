'use server';
// Force recompile

import { db } from '@/lib/prisma';
import { Grade, Gender } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { after } from 'next/server';
import { auth } from '@/auth';
import { verifySecureToken } from '@/lib/security';

export async function checkEmployeeAccess(formData: FormData) {
    const empId = formData.get('empId') as string;
    if (!empId || empId.length > 50) {
        throw new Error('Valid Employee ID is required (max 50 chars)');
    }
    redirect(`/tni/${empId}`);
}

// We need to wrap the cached function to pass the empId to the keyParts
export const getEmployeeProfile = async (empId: string) => {
    return unstable_cache(
        async (id: string) => {
            const employee = await db.employee.findUnique({
                where: { id },
                include: {
                    nominations: {
                        where: { createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } },
                        include: { program: true }
                    },
                    trainingHistory: {
                        orderBy: { startDate: 'desc' }
                    }
                }
            });

            const sections = await db.section.findMany({
                orderBy: { name: 'asc' }
            });

            const priority: Record<string, number> = { 'Approved': 1, 'Pending': 2, 'Rejected': 3 };
            if (employee) {
                employee.nominations.sort((a, b) => (priority[a.status] || 99) - (priority[b.status] || 99));
            }

            return { employee, sections };
        },
        [`employee-profile-${empId}`],
        { revalidate: 3600, tags: ['employee-profile', `employee-${empId}`, 'sections'] }
    )(empId);
};

export async function updateEmployeeProfile(empId: string, data: {
    name: string;
    email: string;
    grade: unknown;
    sectionName: string;
    location: string;
    gender?: string;
    mobile?: string;
    designation?: string;
    doj?: Date | null;
    dob?: Date | null;
    projectLocation?: string;
    managerName?: string;
    managerEmail?: string;
    managerMobile?: string;
    status?: string;
}) {
    try {
        const updated = await db.employee.upsert({
            where: { id: empId },
            update: {
                name: data.name.substring(0, 100),
                email: data.email.substring(0, 100),
                grade: (() => {
                    if (!data.grade) throw new Error("Grade is required");
                    return data.grade as Grade;
                })(),
                sectionName: data.sectionName.substring(0, 100),
                location: data.location.substring(0, 100),
                gender: data.gender ? (data.gender.toUpperCase() as Gender) : null,
                mobile: data.mobile?.substring(0, 15),
                designation: data.designation?.substring(0, 100),
                doj: data.doj,
                dob: data.dob,
                projectLocation: data.projectLocation?.substring(0, 100),
                managerName: data.managerName?.substring(0, 100),
                managerEmail: data.managerEmail?.substring(0, 100),
                managerMobile: data.managerMobile?.substring(0, 15),
                status: data.status,
            },
            create: {
                id: empId.substring(0, 50),
                name: data.name.substring(0, 100),
                email: data.email.substring(0, 100),
                grade: data.grade as Grade,
                sectionName: data.sectionName.substring(0, 100),
                location: data.location.substring(0, 100),
                gender: data.gender ? (data.gender.toUpperCase() as Gender) : null,
                mobile: data.mobile?.substring(0, 15),
                designation: data.designation?.substring(0, 100),
                doj: data.doj,
                dob: data.dob,
                projectLocation: data.projectLocation?.substring(0, 100),
                managerName: data.managerName?.substring(0, 100),
                managerEmail: data.managerEmail?.substring(0, 100),
                managerMobile: data.managerMobile?.substring(0, 15),
                status: data.status || 'Active',
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
export const getAvailablePrograms = async (grade?: Grade, sectionName?: string) => {
    return unstable_cache(
        async (g?: Grade, s?: string) => {
            const where: { AND: any[] } = {
                AND: []
            };

            if (g) {
                where.AND.push({ targetGrades: { has: g } });
            }

            // Removed the section-based locking for HEMM programs as per request,
            // so everyone can see all HEMM programs regardless of their section.

            return await db.program.findMany({
                where,
                orderBy: { name: 'asc' },
                include: { sections: true }
            });
        },
        [`available-programs-${grade || 'all'}-${sectionName || 'all'}`],
        { revalidate: 86400, tags: ['programs'] }
    )(grade, sectionName);
};

// CACHED: Manager Approval Data
export const getManagerApprovalData = async (empId: string) => {
    return unstable_cache(
        async (id: string) => {
            const employee = await db.employee.findUnique({
                where: { id },
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
        [`manager-approval-data-${empId}`],
        { revalidate: 3600, tags: ['manager-approval', `manager-approval-${empId}`] }
    )(empId);
};

import { sendTNIApprovalEmail } from '@/lib/email';

export async function submitTNINomination(formData: FormData) {
    const empId = formData.get('empId') as string;
    const justification = formData.get('justification') as string;
    const bypassEmail = formData.get('bypassEmail') === 'on';

    // Collect all selected program IDs
    const programIds: string[] = [];

    const p1 = formData.get('programId_SAFETY_PROGRAMS') as string;
    if (p1) programIds.push(p1);

    const p2 = formData.get('programId_HEMM_PROGRAMS') as string;
    if (p2) programIds.push(p2);

    const p3 = formData.get('programId_BEHAVIOURAL_PROGRAMS') as string;
    if (p3) programIds.push(p3);

    const p4 = formData.get('programId_OTHER_PROGRAMS') as string;
    if (p4) programIds.push(p4);

    const p5 = formData.get('programId_OPERATOR_PROGRAMS') as string;
    if (p5) programIds.push(p5);

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
                status: bypassEmail ? 'Approved' : 'Pending',
                managerApprovalStatus: bypassEmail ? 'Approved' : 'Pending'
            }))
        });


        // 1. Fetch Employee Details to get Manager Email & Name
        const employee = await db.employee.findUnique({
            where: { id: empId },
            select: { name: true, managerEmail: true, managerName: true }
        });

        if (!bypassEmail) {
            if (employee && employee.managerEmail) {
                // 2. Fetch Program Names for the email
                const programs = await db.program.findMany({
                    where: { id: { in: programIds } },
                    select: { name: true }
                });
                const programNames = programs.map(p => p.name);

                // 3. Send the single consolidated email in the BACKGROUND
                after(async () => {
                    try {
                        await sendTNIApprovalEmail(
                            employee.managerEmail!,
                            employee.managerName || 'Manager',
                            employee.name,
                            programNames,
                            safeJustification || 'No justification provided',
                            empId
                        );
                    } catch (emailError) {
                        console.error("Background Email Error:", emailError);
                    }
                });
            } else {
                console.warn(`Manager email not found for employee ${empId}, skipping email notification.`);
            }
        }

        revalidateTag('employee-profile', 'max');
        revalidateTag('manager-approval', 'max');
        revalidateTag('tni-reports', 'max');
    } catch (error) {
        console.error("Failed to submit nominations:", error);
        throw new Error("Failed to submit nominations");
    }

    redirect(`/tni/${empId}`);
}

export async function updateNominationStatus(nominationId: string, status: 'Approved' | 'Rejected', token?: string) {
    const session = await auth();
    const isAdmin = session?.user?.role === 'ADMIN';

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

        // Invalidate TNI Reports cache
        revalidateTag('tni-reports', 'max');

        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: 'Failed to update status' };
    }
}
