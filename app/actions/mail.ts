'use server'

import { sendApprovalEmail, sendFeedbackRequestEmail } from '@/lib/email';
import { db } from '@/lib/db';

/**
 * Triggered from the Nominations Dashboard
 */
export async function notifyManagerAction(nominationId: string) {
    try {
        const nomination = await db.nomination.findUnique({
            where: { id: nominationId },
        });

        if (!nomination) return { success: false, error: "Nomination not found" };

        return await sendApprovalEmail(
            nomination.managerEmail,
            nomination.managerName,
            nomination.employeeName, // Corrected from nomineeName to employeeName
            nomination.justification,
            nomination.id
        );
    } catch (error) {
        console.error("Action Error:", error);
        return { success: false, error: "Failed to notify manager" };
    }
}

/**
 * Triggered from the Training Sessions / Enrollments Dashboard
 */
export async function sendEmployeeFeedbackAction(enrollmentId: string) {
    try {
        const enrollment = await db.enrollment.findUnique({
            where: { id: enrollmentId },
            include: { session: true } // Need this to get the programName from the relation
        });

        if (!enrollment) return { success: false, error: "Enrollment not found" };

        return await sendFeedbackRequestEmail(
            enrollment.employeeEmail,
            enrollment.employeeName,
            enrollment.session.programName, // Accessing programName via the session relation
            enrollment.id
        );
    } catch (error) {
        console.error("Action Error:", error);
        return { success: false, error: "Failed to send feedback link" };
    }
}