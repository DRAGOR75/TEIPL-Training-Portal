'use server'

import { sendFeedbackRequestEmail } from '@/lib/email';
import { db } from '@/lib/db';

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