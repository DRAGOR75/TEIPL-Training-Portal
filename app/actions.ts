'use server'

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';

// --- TYPES ---
export type ParticipantData = {
    name: string;
    email: string;
    managerEmail: string;
};

// 1. DASHBOARD LOGIC
export async function getDashboardData() {
    try {
        const sessions = await db.trainingSession.findMany({
            include: { enrollments: true },
            orderBy: { completionDate: 'desc' },
        });
        const pendingCount = await db.enrollment.count({
            where: { status: { not: 'Completed' } },
        });
        return { sessions, pendingCount };
    } catch (error) {
        return { sessions: [], pendingCount: 0 };
    }
}

// 2. NOMINATION LOGIC
export async function getUpcomingSessions() {
    try {
        return await db.trainingSession.findMany({
            where: { completionDate: { gte: new Date() } },
            orderBy: { completionDate: 'asc' },
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
            // Select details needed for the email
            select: {
                managerEmail: true,
                employeeName: true,
                session: { select: { programName: true } }
            }
        });

        // 2. Send Email to Manager
        const managerLink = `http://localhost:3000/feedback/manager/${enrollmentId}`;

        await sendEmail(
            updatedEnrollment.managerEmail,
            `Action Required: Feedback Review for ${updatedEnrollment.employeeName}`,
            `
            <h2>Training Effectiveness Review</h2>
            <p><strong>Employee:</strong> ${updatedEnrollment.employeeName}</p>
            <p><strong>Program:</strong> ${updatedEnrollment.session.programName}</p>
            <p>The employee has submitted their post-training feedback.</p>
            <p><strong>Please click the link below to validate their ratings:</strong></p>
            <p><a href="${managerLink}"> Please Review</a></p>
            <br />
            <p><em>This is an automated message from the Thriveni Training System.</em></p>
            `
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

        for (const enrollment of session.enrollments) {
            if (enrollment.status === 'Pending') {
                const feedbackLink = `http://localhost:3000/feedback/employee/${enrollment.id}`;

                await sendEmail(
                    enrollment.employeeEmail,
                    `Feedback Requested: ${session.programName}`,
                    `
                    <p>Hi ${enrollment.employeeName},</p>
                    <p>The training <strong>"${session.programName}"</strong> has concluded.</p>
                    <p>Please take 2 minutes to provide your effectiveness rating.</p>
                    <p><a href="${feedbackLink}"> Click here to Rate the Training</a></p>
                    <br/>
                    <p><em>Thriveni Training System</em></p>
                    `
                );
            }
        }

        await db.trainingSession.update({
            where: { id: sessionId },
            data: { emailsSent: true }
        });

        revalidatePath('/admin/dashboard');
        return { success: true, message: `Emails sent to ${session.enrollments.length} employees.` };
    } catch (error) {
        console.error("Bulk Email Error:", error);
        return { success: false, error: "Failed to send emails" };
    }
}

// 6. CREATE SESSION LOGIC
export async function createTrainingSession(formData: FormData) {
    const programName = formData.get('programName') as string;
    const trainerName = formData.get('trainerName') as string;
    const dateStr = formData.get('date') as string;

    if (!programName || !dateStr) {
        return { success: false, message: "Missing required fields" };
    }

    try {
        await db.trainingSession.create({
            data: {
                programName,
                trainerName,
                completionDate: new Date(dateStr),
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

// 7. ADD PARTICIPANTS (CSV/MANUAL) - NEW!
export async function addParticipants(sessionId: string, participants: ParticipantData[]) {
    try {
        if (!sessionId) return { success: false, error: "Session ID missing" };

        // Bulk Insert with skipDuplicates to prevent errors if email already exists in session
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