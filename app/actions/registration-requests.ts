'use server';

import { db } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Grade, Gender } from '@prisma/client';
import { sendManagerSessionApprovalEmail, sendRegistrationRequestNotificationEmail } from '@/lib/email';

export interface SubmitRegistrationRequestPayload {
    empId: string;
    name: string;
    email: string;
    mobile?: string;
    gender?: Gender | '';
    grade?: Grade;
    sectionName?: string;
    department?: string;
    departmentGroup?: string;
    designation?: string;
    location?: string; // Region
    region?: string;   // Location
    projectLocation?: string;
    organization?: string;
    employeeGrouupMNmw?: string;
    onRollContract?: string;
    highestQualification?: string;
    managerId?: string;
    managerName?: string;
    managerEmail?: string;
    managerMobile?: string;
    batchId: string;
}

export interface AdminRegistrationOverrides {
    name?: string;
    email?: string;
    mobile?: string;
    gender?: Gender | '';
    grade?: Grade;
    status?: string;
    aadharNumber?: string;
    dob?: string | null;
    doj?: string | null;
    departmentGroup?: string;
    department?: string;
    sectionName?: string;
    designation?: string;
    location?: string; // Region
    region?: string;   // Location
    projectLocation?: string;
    organization?: string;
    employeeGrouupMNmw?: string;
    onRollContract?: string;
    highestQualification?: string;
    managerId?: string;
    managerName?: string;
    managerEmail?: string;
    managerMobile?: string;
}

export async function submitRegistrationRequest(payload: SubmitRegistrationRequestPayload) {
    try {
        const cleanEmpId = payload.empId?.trim().toUpperCase();
        const cleanName = payload.name?.trim();
        const cleanEmail = payload.email?.trim().toLowerCase();
        const batchId = payload.batchId?.trim();

        if (!cleanEmpId || cleanEmpId.length > 50) return { error: "Valid Employee ID is required." };
        if (!cleanName || cleanName.length > 100) return { error: "Valid Full Name is required." };
        if (!cleanEmail || cleanEmail.length > 100) return { error: "Valid Official Email is required." };
        if (!batchId) return { error: "Target Session / Batch ID is required." };

        // 1. Verify that the batch exists and is still open
        const batch = await db.nominationBatch.findUnique({
            where: { id: batchId },
            include: { program: true, trainingSession: true }
        });

        if (!batch) {
            return { error: "Invalid training batch." };
        }

        if (batch.status !== 'Forming') {
            return { error: "This training batch has been closed or completed. You cannot join now." };
        }

        // 2. Check if employee already exists in master table (by ID or Email)
        const existingEmployee = await db.employee.findUnique({
            where: { id: cleanEmpId }
        });

        if (existingEmployee) {
            return {
                error: "ALREADY_REGISTERED",
                message: "You are already registered in the master records! Please return and use the standard enrollment button."
            };
        }

        const existingByEmail = await db.employee.findUnique({
            where: { email: cleanEmail },
            select: { id: true }
        });

        if (existingByEmail) {
            return {
                error: `This email address is already registered under Employee ID "${existingByEmail.id}". Please use your registered Employee ID or contact Admin.`
            };
        }

        // 3. Check if there's already a pending request for this employee and batch
        const existingRequest = await db.registrationRequest.findFirst({
            where: {
                empId: cleanEmpId,
                batchId: batchId,
                status: 'Pending'
            }
        });

        if (existingRequest) {
            return {
                success: true,
                alreadyPending: true,
                message: "Your registration request is already submitted and awaiting Admin confirmation."
            };
        }

        // 4. Derive sensible defaults for internal groups if not provided
        let defaultGroup = payload.employeeGrouupMNmw || '';
        if (!defaultGroup && payload.grade) {
            if (payload.grade === 'WORKMAN') defaultGroup = 'Workman';
            else if (payload.grade === 'EXECUTIVE') defaultGroup = 'Non Manager';
            else defaultGroup = 'Non Manager';
        }

        // 5. Create the registration request
        const newRequest = await db.registrationRequest.create({
            data: {
                empId: cleanEmpId,
                name: cleanName,
                email: cleanEmail,
                mobile: payload.mobile?.trim() || null,
                gender: payload.gender ? (payload.gender as Gender) : null,
                grade: payload.grade || Grade.EXECUTIVE,
                departmentGroup: payload.departmentGroup?.trim() || null,
                department: payload.department?.trim() || null,
                sectionName: payload.sectionName?.trim() || null,
                designation: payload.designation?.trim() || null,
                location: payload.location?.trim() || null,
                region: payload.region?.trim() || null,
                projectLocation: payload.projectLocation?.trim() || null,
                organization: payload.organization?.trim() || null,
                employeeGrouupMNmw: defaultGroup || null,
                onRollContract: payload.onRollContract?.trim() || 'On-Roll',
                highestQualification: payload.highestQualification?.trim() || null,
                managerId: payload.managerId?.trim() || null,
                managerName: payload.managerName?.trim() || null,
                managerEmail: payload.managerEmail?.trim() || null,
                managerMobile: payload.managerMobile?.trim() || null,
                batchId: batchId,
                status: 'Pending'
            }
        });

        // 6. Send notification email to bvg@thriveni.com and cyn@thriveni.com
        sendRegistrationRequestNotificationEmail({
            participant: {
                empId: cleanEmpId,
                name: cleanName,
                email: cleanEmail,
                mobile: payload.mobile?.trim() || null,
                grade: payload.grade || Grade.EXECUTIVE,
                designation: payload.designation?.trim() || null,
                department: payload.department?.trim() || null,
                sectionName: payload.sectionName?.trim() || null,
                location: payload.location?.trim() || null,
                managerName: payload.managerName?.trim() || null,
                managerEmail: payload.managerEmail?.trim() || null,
            },
            batchDetails: {
                programName: batch.trainingSession?.altProgramName || batch.program.name,
                trainerName: batch.trainingSession?.trainerName,
                startDate: batch.trainingSession?.startDate,
                endDate: batch.trainingSession?.endDate,
                location: batch.trainingSession?.location,
                sessionId: batch.trainingSession?.id || null,
            },
            requestId: newRequest.id
        }).catch(err => {
            console.error("Failed to send admin notification email for registration request:", err);
        });

        revalidatePath('/admin/registration-requests');

        return {
            success: true,
            programName: batch.trainingSession?.altProgramName || batch.program.name,
            employeeName: cleanName
        };
    } catch (error: any) {
        console.error("Error in submitRegistrationRequest:", error);
        return { error: error.message || "Failed to submit registration request. Please try again." };
    }
}

export async function getRegistrationRequests(status: string = 'Pending') {
    const session = await auth();
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
        return { requests: [], error: 'Unauthorized: Admin access required' };
    }

    try {
        const whereClause = status === 'ALL' ? {} : { status };
        const requests = await db.registrationRequest.findMany({
            where: whereClause,
            include: {
                batch: {
                    include: {
                        program: { select: { id: true, name: true } },
                        trainingSession: {
                            select: {
                                id: true,
                                programName: true,
                                altProgramName: true,
                                trainerName: true,
                                startDate: true,
                                endDate: true,
                                location: true,
                                requireManagerApproval: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const [pendingCount, approvedCount, rejectedCount, allCount] = await Promise.all([
            db.registrationRequest.count({ where: { status: 'Pending' } }),
            db.registrationRequest.count({ where: { status: 'Approved' } }),
            db.registrationRequest.count({ where: { status: 'Rejected' } }),
            db.registrationRequest.count()
        ]);

        return { requests, pendingCount, approvedCount, rejectedCount, allCount };
    } catch (error: any) {
        console.error("Error in getRegistrationRequests:", error);
        return { requests: [], error: error.message || "Failed to fetch requests" };
    }
}

export async function approveRegistrationRequest(
    requestId: string,
    adminOverrides?: AdminRegistrationOverrides
) {
    const session = await auth();
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized: Admin access required' };
    }

    try {
        const req = await db.registrationRequest.findUnique({
            where: { id: requestId },
            include: {
                batch: {
                    include: {
                        program: true,
                        trainingSession: true
                    }
                }
            }
        });

        if (!req) return { success: false, error: "Registration request not found." };
        if (req.status !== 'Pending') {
            return { success: false, error: `This request has already been ${req.status.toLowerCase()}.` };
        }

        const adminName = session.user.name || session.user.email || 'Admin';

        // Prepare combined employee data
        const finalName = adminOverrides?.name?.trim() || req.name;
        const finalEmail = adminOverrides?.email?.trim().toLowerCase() || req.email;
        const finalMobile = adminOverrides?.mobile?.trim() || req.mobile;
        const finalGender = adminOverrides?.gender ? (adminOverrides.gender as Gender) : req.gender;
        const finalGrade = adminOverrides?.grade || req.grade || Grade.EXECUTIVE;
        const finalStatus = adminOverrides?.status || 'Active';
        const finalAadhar = adminOverrides?.aadharNumber?.trim() || null;
        const finalDob = adminOverrides?.dob ? new Date(adminOverrides.dob) : null;
        const finalDoj = adminOverrides?.doj ? new Date(adminOverrides.doj) : null;
        const finalDeptGroup = adminOverrides?.departmentGroup?.trim() || req.departmentGroup;
        const finalDept = adminOverrides?.department?.trim() || req.department;
        const finalSection = adminOverrides?.sectionName?.trim() || req.sectionName;
        const finalDesignation = adminOverrides?.designation?.trim() || req.designation;
        const finalLocation = adminOverrides?.location?.trim() || req.location;
        const finalRegion = adminOverrides?.region?.trim() || req.region;
        const finalProjectLocation = adminOverrides?.projectLocation?.trim() || req.projectLocation;
        const finalOrg = adminOverrides?.organization?.trim() || req.organization;
        const finalEmpGroup = adminOverrides?.employeeGrouupMNmw?.trim() || req.employeeGrouupMNmw;
        const finalOnRoll = adminOverrides?.onRollContract?.trim() || req.onRollContract;
        const finalHighestQual = adminOverrides?.highestQualification?.trim() || req.highestQualification;
        const finalManagerId = adminOverrides?.managerId?.trim() || req.managerId;
        const finalManagerName = adminOverrides?.managerName?.trim() || req.managerName;
        const finalManagerEmail = adminOverrides?.managerEmail?.trim() || req.managerEmail;
        const finalManagerMobile = adminOverrides?.managerMobile?.trim() || req.managerMobile;

        // Execute atomically
        await db.$transaction(async (tx) => {
            // 1. Create or Update Master Employee
            const employee = await tx.employee.upsert({
                where: { id: req.empId },
                update: {
                    name: finalName,
                    email: finalEmail,
                    mobile: finalMobile,
                    gender: finalGender,
                    grade: finalGrade,
                    status: finalStatus,
                    aadharNumber: finalAadhar,
                    dob: finalDob,
                    doj: finalDoj,
                    departmentGroup: finalDeptGroup,
                    department: finalDept,
                    sectionName: finalSection,
                    designation: finalDesignation,
                    location: finalLocation,
                    region: finalRegion,
                    projectLocation: finalProjectLocation,
                    organization: finalOrg,
                    employeeGrouupMNmw: finalEmpGroup,
                    onRollContract: finalOnRoll,
                    highestQualification: finalHighestQual,
                    managerId: finalManagerId,
                    managerName: finalManagerName,
                    managerEmail: finalManagerEmail,
                    managerMobile: finalManagerMobile,
                },
                create: {
                    id: req.empId,
                    name: finalName,
                    email: finalEmail,
                    mobile: finalMobile,
                    gender: finalGender,
                    grade: finalGrade,
                    status: finalStatus,
                    aadharNumber: finalAadhar,
                    dob: finalDob,
                    doj: finalDoj,
                    departmentGroup: finalDeptGroup,
                    department: finalDept,
                    sectionName: finalSection,
                    designation: finalDesignation,
                    location: finalLocation,
                    region: finalRegion,
                    projectLocation: finalProjectLocation,
                    organization: finalOrg,
                    employeeGrouupMNmw: finalEmpGroup,
                    onRollContract: finalOnRoll,
                    highestQualification: finalHighestQual,
                    managerId: finalManagerId,
                    managerName: finalManagerName,
                    managerEmail: finalManagerEmail,
                    managerMobile: finalManagerMobile,
                }
            });

            // 2. Link or create Nomination for this session/batch
            const existingNomination = await tx.nomination.findFirst({
                where: {
                    empId: employee.id,
                    batchId: req.batchId
                }
            });

            let nomination = existingNomination;
            if (!nomination) {
                nomination = await tx.nomination.create({
                    data: {
                        empId: employee.id,
                        programId: req.batch.programId,
                        batchId: req.batchId,
                        status: 'Batched',
                        source: 'QR',
                        justification: 'Approved JIT Self-Registration',
                        managerApprovalStatus: req.batch.trainingSession?.requireManagerApproval ? 'Pending' : 'Approved'
                    }
                });
            }

            // 3. Create default attendance records if class dates exist
            if (req.batch.trainingSession?.classDates && req.batch.trainingSession.classDates.length > 0) {
                const attendanceData = req.batch.trainingSession.classDates.map(date => ({
                    sessionId: req.batch.trainingSession!.id,
                    empId: employee.id,
                    date: date,
                    status: 'Present'
                }));
                await tx.attendanceRecord.createMany({
                    data: attendanceData,
                    skipDuplicates: true
                });
            }

            // 4. Update the request status and fields
            await tx.registrationRequest.update({
                where: { id: requestId },
                data: {
                    status: 'Approved',
                    reviewedBy: adminName,
                    reviewedAt: new Date(),
                    name: finalName,
                    email: finalEmail,
                    mobile: finalMobile,
                    gender: finalGender,
                    grade: finalGrade,
                    departmentGroup: finalDeptGroup,
                    department: finalDept,
                    sectionName: finalSection,
                    designation: finalDesignation,
                    location: finalLocation,
                    region: finalRegion,
                    projectLocation: finalProjectLocation,
                    organization: finalOrg,
                    employeeGrouupMNmw: finalEmpGroup,
                    onRollContract: finalOnRoll,
                    highestQualification: finalHighestQual,
                    managerId: finalManagerId,
                    managerName: finalManagerName,
                    managerEmail: finalManagerEmail,
                    managerMobile: finalManagerMobile,
                }
            });

            // 5. Manager email if approval required
            if (req.batch.trainingSession && finalManagerEmail && req.batch.trainingSession.requireManagerApproval && nomination) {
                const { startDate, endDate } = req.batch.trainingSession;
                const programName = req.batch.trainingSession.altProgramName || req.batch.program.name;
                await sendManagerSessionApprovalEmail(
                    finalManagerEmail,
                    finalManagerName || 'Manager',
                    finalName,
                    programName,
                    startDate,
                    endDate,
                    nomination.id,
                    req.batch.trainingSession.topics || req.batch.program.objectives
                ).catch(console.error);
            }
        });

        revalidatePath('/admin/registration-requests');
        revalidatePath('/admin/employees');
        revalidatePath('/admin/tni-dashboard/employees');
        revalidatePath('/admin/sessions');
        revalidateTag('employee-profile', 'max');
        revalidateTag('sessions-list', 'max');
        revalidateTag('session-details', 'max');
        revalidateTag('tni-reports', 'max');

        return {
            success: true,
            employeeName: finalName,
            programName: req.batch.trainingSession?.altProgramName || req.batch.program.name
        };
    } catch (error: any) {
        console.error("Error in approveRegistrationRequest:", error);
        if (error?.code === 'P2002') {
            return { success: false, error: "This email address or Employee ID conflicts with an existing employee record." };
        }
        return { success: false, error: error.message || "Failed to approve registration request" };
    }
}

export async function rejectRegistrationRequest(requestId: string, reason: string) {
    const session = await auth();
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized: Admin access required' };
    }

    try {
        const req = await db.registrationRequest.findUnique({
            where: { id: requestId }
        });

        if (!req) return { success: false, error: "Registration request not found." };
        if (req.status !== 'Pending') {
            return { success: false, error: `This request has already been ${req.status.toLowerCase()}.` };
        }

        const adminName = session.user.name || session.user.email || 'Admin';

        await db.registrationRequest.update({
            where: { id: requestId },
            data: {
                status: 'Rejected',
                rejectionReason: reason?.trim() || 'Declined by Administrator',
                reviewedBy: adminName,
                reviewedAt: new Date()
            }
        });

        revalidatePath('/admin/registration-requests');

        return { success: true };
    } catch (error: any) {
        console.error("Error in rejectRegistrationRequest:", error);
        return { success: false, error: error.message || "Failed to reject request" };
    }
}

export interface EnrollmentEmployeeCandidate {
    id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    location: string;
}

/**
 * Search employees by name, Employee ID, or email for Quick Join self-enrollment.
 */
export async function searchEmployeesForEnrollment(
    query: string
): Promise<{ candidates: EnrollmentEmployeeCandidate[]; error?: string }> {
    const q = (query || '').trim();
    if (!q || q.length < 2) {
        return { candidates: [] };
    }

    try {
        const employees = await db.employee.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { id: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                department: true,
                sectionName: true,
                designation: true,
                location: true
            },
            take: 30,
            orderBy: { name: 'asc' }
        });

        const candidates: EnrollmentEmployeeCandidate[] = employees.map(e => ({
            id: e.id,
            name: e.name,
            email: e.email,
            department: e.sectionName || e.department || 'N/A',
            designation: e.designation || 'Staff',
            location: e.location || 'N/A'
        }));

        return { candidates };
    } catch (error: any) {
        console.error("Error in searchEmployeesForEnrollment:", error);
        return { candidates: [], error: "Failed to search employees" };
    }
}
