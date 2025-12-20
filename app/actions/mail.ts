'use server'

import { sendApprovalEmail, sendFeedbackRequestEmail } from '@/lib/email';
import { db } from '@/lib/db'; // Adjust this to your Prisma client path

/**
 * Triggered when you want to notify a Manager about a new Nomination
 */
export async function notifyManagerAction(nominationId: string) {
    try {
        const nomination = await db.nomination.findUnique({
            where: { id: nominationId },
        });

        if (!nomination) return { success: false, error: "Nomination not found" };

        // Calls your updated OAuth2 email function
        return await sendApprovalEmail(
            nomination.managerEmail,
            nomination.managerName,
            nomination.nomineeName,
            nomination.justification || "Training nomination request",
            nomination.id
        );
    } catch (error) {
        console.error("Action Error:", error);
        return { success: false, error: "System failed to send mail" };
    }
}

/**
 * Triggered when you click "Send Feedback Link" for an Employee
 */
export async function sendEmployeeFeedbackAction(enrollmentId: string) {
    try {
        const enrollment = await db.enrollment.findUnique({
            where: { id: enrollmentId },
        });

        if (!enrollment) return { success: false, error: "Enrollment not found" };

        return await sendFeedbackRequestEmail(
            enrollment.employeeEmail,
            enrollment.employeeName,
            enrollment.programName,
            enrollment.id
        );
    } catch (error) {
        console.error("Action Error:", error);
        return { success: false, error: "System failed to send feedback link" };
    }
}