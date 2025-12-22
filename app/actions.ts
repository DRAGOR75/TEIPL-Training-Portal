'use server'

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendEmail, sendFeedbackRequestEmail } from '@/lib/email';

// --- TYPES ---
export type ParticipantData = {
    name: string;
    email: string;
    managerEmail: string;
};

// 1. DASHBOARD LOGIC (Updated for Start Date)
export async function getDashboardData() {
    try {
        const sessions = await db.trainingSession.findMany({
            include: { enrollments: true }, // 👈 This fixes the "enrollments missing" error
            orderBy: { startDate: 'desc' }, // 🟢 Updated from completionDate
        });

        // Count pending reviews (Status = 'Pending Manager')
        const pendingCount = await db.enrollment.count({
            where: { status: 'Pending Manager' },
        });

        return { sessions, pendingCount };
    } catch (error) {
        console.error("Dashboard Data Error:", error);
        return { sessions: [], pendingCount: 0 };
    }
}

// 2. NOMINATION LOGIC
export async function getUpcomingSessions() {
    try {
        return await db.trainingSession.findMany({
            where: { startDate: { gte: new Date() } }, // 🟢 Updated
            orderBy: { startDate: 'asc' },
        });
    } catch (error) {
        return [];
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
                employeeName: true,
                session: { select: { programName: true } }
            }
        });

        // 2. Send Email to Manager
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://templtrainingportal.vercel.app';
        const managerLink = `${baseUrl}/feedback/manager/${enrollmentId}`;

        await sendEmail({
            to: updatedEnrollment.managerEmail,
            subject: `Action Required: Feedback Review for ${updatedEnrollment.employeeName}`,
            html: `
            <h2>Training Effectiveness Review</h2>
            <p><strong>Employee:</strong> ${updatedEnrollment.employeeName}</p>
            <p><strong>Program:</strong> ${updatedEnrollment.session.programName}</p>
            <p>The employee has submitted their post-training feedback.</p>
            <p><strong>Please click the link below to validate their ratings:</strong></p>
            <p><a href="${managerLink}">👉 Click Here to Review</a></p>
            `
        });

        return { success: true };
    } catch (error) {
        console.error("Feedback Error:", error);
        return { success: false, error: "Failed to save feedback" };
    }
}

// 4. MANAGER REVIEW LOGIC
export async function submitManagerReview(formData: FormData) {
    const enrollmentId = formData.get('enrollmentId') as string;
    const agree = formData.get('agree') as string;
    const comments = formData.get('comments') as string;

    try {
        await db.enrollment.update({
            where: { id: enrollmentId },
            data: {
                managerAgrees: agree,
                managerComment: comments,
                status: 'Completed',
            },
        });

        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
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

        let count = 0;
        for (const enrollment of session.enrollments) {
            if (enrollment.status === 'Pending') {
                await sendFeedbackRequestEmail(
                    enrollment.employeeEmail,
                    enrollment.employeeName,
                    session.programName,
                    enrollment.id
                );
                count++;
            }
        }

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

// 6. CREATE SESSION LOGIC (🟢 UPDATED for Start/End Dates)
export async function createTrainingSession(formData: FormData) {
    const programName = formData.get('programName') as string;
    const trainerName = formData.get('trainerName') as string;

    // 🟢 Get the new date fields
    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;
    const feedbackDateStr = formData.get('feedbackCreationDate') as string;

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