'use server'

import { db } from "@/lib/db";
import { redirect } from 'next/navigation';
import { revalidatePath } from "next/cache"; // 🟢 Added for auto-sync
import { sendFeedbackAcknowledgmentEmail } from "@/lib/email";

export async function selfEnroll(formData: FormData) {
    const sessionId = formData.get('sessionId') as string;
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const managerEmail = formData.get('managerEmail') as string;

    // 1. Validation Check
    if (!sessionId || !email || !managerEmail || !name) {
        throw new Error("Missing Required Fields");
    }

    try {
        // 2. Extract Data with Default Values
        const data = {
            sessionId,
            employeeName: name,
            employeeEmail: email,
            empId: formData.get('empId') as string,
            managerName: formData.get('managerName') as string,
            managerEmail,
            preTrainingRating: parseInt(formData.get('preTrainingRating') as string) || 0,
            postTrainingRating: parseInt(formData.get('postTrainingRating') as string) || 0,
            trainingRating: parseInt(formData.get('trainingRating') as string) || 0,
            contentRating: parseInt(formData.get('contentRating') as string) || 0,
            trainerRating: parseInt(formData.get('trainerRating') as string) || 0,
            materialRating: parseInt(formData.get('materialRating') as string) || 0,
            recommendationRating: (formData.get('recommendationRating') as string) === '5', // 5 (Yes) -> true, 1 (No) -> false
            topicsLearned: formData.get('topicsLearned') as string,
            actionPlan: formData.get('actionPlan') as string,
            suggestions: formData.get('suggestions') as string,
            status: 'Pending',
        };

        // 3. Upsert Logic (Update if exists, Create if new)
        // This is more robust than a simple check-and-create
        await db.enrollment.upsert({
            where: {
                sessionId_employeeEmail: {
                    sessionId,
                    employeeEmail: email
                }
            },
            update: data, // Update their feedback if they submit again
            create: data
        });

        // 4. 🟢 REVALIDATION: Tell the server the Dashboard is now "Stale"
        revalidatePath("/admin/dashboard");

        // 5. Send Acknowledgment Email (Non-blocking)
        // Fetch session name first if not available efficiently, but here we query it.
        const session = await db.trainingSession.findUnique({
            where: { id: sessionId },
            select: { programName: true }
        });

        if (session) {
            await sendFeedbackAcknowledgmentEmail(email, name, session.programName, {
                preTraining: data.preTrainingRating,
                postTraining: data.postTrainingRating,
                training: data.trainingRating,
                content: data.contentRating,
                trainer: data.trainerRating,
                material: data.materialRating,
                recommendation: data.recommendationRating,
                topicsLearned: data.topicsLearned,
                actionPlan: data.actionPlan,
                suggestions: data.suggestions
            });
        }

    } catch (error) {
        console.error("Enrollment Failed", error);
        throw new Error("Database Error");
    }

    // 5. Redirect happens after revalidation
    redirect('/join/success');
}