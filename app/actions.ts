'use server'

import { db } from "@/lib/prisma";
import { revalidatePath } from 'next/cache';
import { sendEmail, sendFeedbackRequestEmail, sendManagerRejectionNotification, sendFeedbackReviewRequestEmail } from '@/lib/email';
import { verifySecureToken } from '@/lib/security';

// --- TYPES ---
export type ParticipantData = {
    name: string;
    email: string;
    managerEmail: string;
};

// 1. DASHBOARD LOGIC (Updated for Start Date)
// 1. CALENDAR METADATA (Lightweight - For Dots)
export async function getCalendarMetadata(trainerName?: string) {
    try {
        // Fetch minimal data for ALL sessions (lightweight)
        // This allows the calendar to show dots for all past/future events without loading heavy enrollments
        const whereClause = trainerName ? { trainerName } : {};

        return await db.trainingSession.findMany({
            where: whereClause,
            select: {
                id: true,
                startDate: true,
                endDate: true,
                feedbackCreationDate: true,
                emailsSent: true,
                sendFeedbackAutomatically: true
            },
            orderBy: { startDate: 'desc' },
        });
    } catch (error) {
        console.error("Metadata Error:", error);
        return [];
    }
}

// 1.b SESSION DETAILS (Heavy - For Selected Date)
export async function getSessionsForDate(dateStr: string, trainerName?: string) {
    try {
        // incorrectly parsing it could lead to timezone issues.
        // We act as if this date is IST Midnight.
        const startOfDay = new Date(dateStr + "T00:00:00.000+05:30");
        const endOfDay = new Date(dateStr + "T23:59:59.999+05:30");

        const dateFilter = {
            OR: [
                // 1. Strict Match: Is this the Session END DATE?
                {
                    endDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                // 2. Strict Match: Is this the FEEDBACK DEADLINE DATE?
                {
                    feedbackCreationDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            ]
        };

        const whereClause = trainerName
            ? { AND: [dateFilter, { trainerName }] }
            : dateFilter;

        const sessions = await db.trainingSession.findMany({
            where: whereClause,
            include: { enrollments: true }, // Heavy data (Enrollments) only for this day
            orderBy: { startDate: 'desc' },
        });

        // Calculate pending reviews for the badge
        // Only count pending reviews for sessions related to this trainer (if trainer is filtering)
        const pendingCountWhere: any = { status: 'Pending Manager' };
        if (trainerName) {
            // Find all session IDs for this trainer
            const trainerSessions = await db.trainingSession.findMany({
                where: { trainerName },
                select: { id: true }
            });
            pendingCountWhere.sessionId = { in: trainerSessions.map(s => s.id) };
        }

        const pendingCount = await db.enrollment.count({
            where: pendingCountWhere,
        });

        return { sessions, pendingCount };
    } catch (error: any) {
        console.error("Dashboard Data Error:", error?.message || error);
        return { sessions: [], pendingCount: 0 };
    }
}

// 1.b TOGGLE FEEDBACK AUTOMATION
export async function toggleFeedbackAutomation(sessionId: string, isEnabled: boolean) {
    try {
        await db.trainingSession.update({
            where: { id: sessionId },
            data: { sendFeedbackAutomatically: isEnabled },
        });
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error toggling automation:", error);
        return { success: false, error: "Failed to update settings" };
    }
}

// 2. NOMINATION LOGIC
export async function getUpcomingSessions() {
    try {
        return await db.trainingSession.findMany({
            where: { startDate: { gte: new Date() } },
            orderBy: { startDate: 'asc' },
        });
    } catch (error) {
        return [];
    }
}

// 2.a SESSION DETAILS (Deep Dive)
export async function getSessionDetails(sessionId: string) {
    try {
        const session = await db.trainingSession.findUnique({
            where: { id: sessionId },
            include: {
                enrollments: {
                    orderBy: { employeeName: 'asc' }
                },
                nominationBatch: true
            }
        });
        return session;
    } catch (error) {
        console.error("Error fetching session details:", error);
        return null;
    }
}

export async function submitNomination(formData: FormData) {
    const sessionId = formData.get('sessionId') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const managerEmail = formData.get('managerEmail') as string;

    try {
        await db.enrollment.create({
            data: {
                sessionId,
                employeeName: name,
                employeeEmail: email,
                managerEmail,
                status: 'Pending',
            },
        });
        return { success: true };
    } catch (error) {
        return { success: false, message: "Database Error" };
    }
}

// 3. EMPLOYEE FEEDBACK LOGIC
export async function submitEmployeeFeedback(formData: FormData) {
    const enrollmentId = formData.get('enrollmentId') as string;
    const token = formData.get('token') as string;

    // 0. SECURITY CHECK (HMAC Verification)
    if (!token || !verifySecureToken(token, enrollmentId)) {
        return { success: false, error: "Unauthorized: Invalid or missing security token." };
    }

    // Parse ratings
    const q1 = parseInt(formData.get('q1') as string) || 0;
    const q2 = parseInt(formData.get('q2') as string) || 0;
    const q3 = parseInt(formData.get('q3') as string) || 0;
    const q4 = parseInt(formData.get('q4') as string) || 0;
    const q5 = parseInt(formData.get('q5') as string) || 0;

    // Calculate Average
    const average = (q1 + q2 + q3 + q4 + q5) / 5;

    try {
        // 1. Update Database
        const updatedEnrollment = await db.enrollment.update({
            where: { id: enrollmentId },
            data: {
                q1_Relevance: q1,
                q2_Application: q2,
                q3_Performance: q3,
                q4_Influence: q4,
                q5_Efficiency: q5,
                averageRating: average,
                status: 'Pending Manager',
            },
            select: {
                managerEmail: true,
                managerName: true, // 🟢 Added managerName
                employeeName: true,
                session: { select: { programName: true } }
            }
        });

        // 2. Send Email to Manager
        await sendFeedbackReviewRequestEmail(
            updatedEnrollment.managerEmail,
            updatedEnrollment.managerName,
            updatedEnrollment.employeeName,
            updatedEnrollment.session.programName,
            enrollmentId
        );

        return { success: true };
    } catch (error) {
        console.error("Feedback Error:", error);
        return { success: false, error: "Failed to save feedback" };
    }
}

// 4. MANAGER REVIEW LOGIC
export async function submitManagerReview(formData: FormData) {
    const enrollmentId = formData.get('enrollmentId') as string;
    const token = formData.get('token') as string;

    // 0. SECURITY CHECK (HMAC Verification)
    if (!token || !verifySecureToken(token, enrollmentId)) {
        return { success: false, error: "Unauthorized: Invalid or missing security token." };
    }
    const agree = formData.get('agree') as string;
    const comments = formData.get('comments') as string;

    try {
        const updatedEnrollment = await db.enrollment.update({
            where: { id: enrollmentId },
            data: {
                managerAgrees: agree,
                managerComment: comments,
                status: agree === 'No' ? 'Manager Disagrees' : 'Completed',
            },
            select: {
                managerName: true,
                managerEmail: true,
                employeeName: true,
                session: {
                    select: {
                        programName: true,
                        trainerName: true
                    }
                }
            }
        });


        if (agree === 'No') {
            try {
                // 1. Find Trainer Email
                let trainerEmail = null;
                if (updatedEnrollment.session.trainerName) {
                    const trainer = await db.trainer.findUnique({
                        where: { name: updatedEnrollment.session.trainerName }
                    });
                    trainerEmail = trainer?.email;
                }

                // 2. Send Notification
                await sendManagerRejectionNotification(
                    updatedEnrollment.managerName || updatedEnrollment.managerEmail || "The Manager",
                    updatedEnrollment.employeeName,
                    updatedEnrollment.session.programName,
                    comments,
                    trainerEmail
                );
            } catch (emailError) {
                console.error("Failed to send rejection notification:", emailError);
                // Don't fail the request, just log it
            }
        }

        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Review Error:", error);
        return { success: false, error: "Failed to save review" };
    }
}

// 5. ADMIN TRIGGER: Send Feedback Links
export async function sendFeedbackEmails(sessionId: string) {
    try {
        const session = await db.trainingSession.findUnique({
            where: { id: sessionId },
            include: { enrollments: true }
        });

        if (!session) return { success: false, error: "Session not found" };

        // 🟢 Optimized: Send all simultaneously (Nodemailer pool handles concurrency)
        const pendingEnrollments = session.enrollments.filter(e => e.status === 'Pending');

        const results = await Promise.all(pendingEnrollments.map(async (enrollment) => {
            try {
                await sendFeedbackRequestEmail(
                    enrollment.employeeEmail,
                    enrollment.employeeName,
                    session.programName,
                    enrollment.id
                );
                return 1;
            } catch (error) {
                console.error(`Failed to send to ${enrollment.employeeEmail}`, error);
                return 0;
            }
        }));

        const count = results.reduce((a: number, b) => a + (b as number), 0);

        await db.trainingSession.update({
            where: { id: sessionId },
            data: { emailsSent: true }
        });

        revalidatePath('/admin/dashboard');
        return { success: true, message: `Emails sent to ${count} employees.` };
    } catch (error) {
        console.error("Bulk Email Error:", error);
        return { success: false, error: "Failed to send emails" };
    }
}

// 6. CREATE SESSION LOGIC 
export async function createTrainingSession(formData: FormData) {
    const programName = formData.get('programName') as string;
    const trainerName = formData.get('trainerName') as string;

    // 🟢 Get the new date fields
    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;
    const feedbackDateStr = formData.get('feedbackCreationDate') as string;

    // New Time Fields
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    if (!programName || !startDateStr || !endDateStr) {
        return { success: false, message: "Missing required fields" };
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    try {
        // 1. Check for Duplicates (Double-click prevention / Logic check)
        const existingSession = await db.trainingSession.findFirst({
            where: {
                programName,
                startDate,
                endDate,
            },
        });

        if (existingSession) {
            return { success: false, message: "A session with this name and dates already exists." };
        }

        // 2. Create Session
        await db.trainingSession.create({
            data: {
                programName,
                trainerName,
                startDate,
                endDate,
                startTime: startTime || "10:00 am",
                endTime: endTime || "1:00 pm",
                // Only set this if the user provided it, otherwise it can be null or handled by logic
                feedbackCreationDate: feedbackDateStr ? new Date(feedbackDateStr) : null,
                templateType: 'Technical',
                emailsSent: false,
            },
        });

        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Create Session Error:", error);
        return { success: false, message: "Database Error" };
    }
}

// 7. ADD PARTICIPANTS (CSV/MANUAL)
export async function addParticipants(sessionId: string, participants: ParticipantData[]) {
    try {
        if (!sessionId) return { success: false, error: "Session ID missing" };

        // Check if batch is locked
        const session = await db.trainingSession.findUnique({
            where: { id: sessionId },
            include: { nominationBatch: true }
        });

        if (!session) {
            return { success: false, error: "Training session not found" };
        }

        if (session?.nominationBatch?.status === 'Scheduled' || session?.nominationBatch?.status === 'Completed') {
            return { success: false, error: "This batch is locked. No new participants can be added." };
        }

        await db.enrollment.createMany({
            data: participants.map((p) => ({
                sessionId,
                employeeName: p.name,
                employeeEmail: p.email,
                managerEmail: p.managerEmail,
                status: "Pending",
            })),
            skipDuplicates: true,
        });

        revalidatePath("/admin/dashboard");
        return { success: true, count: participants.length };
    } catch (error) {
        console.error("Error adding participants:", error);
        return { success: false, error: "Failed to save to database." };
    }
}