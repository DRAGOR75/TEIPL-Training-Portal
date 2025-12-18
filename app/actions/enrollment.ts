'use server'

import { db } from "@/lib/db";
import { redirect } from 'next/navigation';

export async function selfEnroll(formData: FormData) {
    const sessionId = formData.get('sessionId') as string;

    // 1. Extract Personal Info
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const empId = formData.get('empId') as string;
    const managerName = formData.get('managerName') as string;
    const managerEmail = formData.get('managerEmail') as string;

    // 2. Extract Level 1 Ratings (Parse as Integers, default to 0 if missing)
    const preTrainingRating = parseInt(formData.get('preTrainingRating') as string) || 0;
    const postTrainingRating = parseInt(formData.get('postTrainingRating') as string) || 0;
    const trainingRating = parseInt(formData.get('trainingRating') as string) || 0;
    const contentRating = parseInt(formData.get('contentRating') as string) || 0;
    const trainerRating = parseInt(formData.get('trainerRating') as string) || 0;
    const materialRating = parseInt(formData.get('materialRating') as string) || 0;
    const recommendationRating = parseInt(formData.get('recommendationRating') as string) || 0;

    // 3. Extract Text Answers
    const topicsLearned = formData.get('topicsLearned') as string;
    const actionPlan = formData.get('actionPlan') as string;
    const suggestions = formData.get('suggestions') as string;

    // Validation
    if (!sessionId || !email || !managerEmail || !name) {
        // In a real app, you might return an error state here, 
        // but for now we'll just throw to stop execution
        throw new Error("Missing Required Fields");
    }

    try {
        // 4. Check for existing enrollment to prevent duplicates
        // We check if this email is already registered for this specific session
        const existing = await db.enrollment.findUnique({
            where: {
                sessionId_employeeEmail: {
                    sessionId,
                    employeeEmail: email
                }
            }
        });

        // 5. Save to Database
        if (!existing) {
            await db.enrollment.create({
                data: {
                    sessionId,
                    employeeName: name,
                    employeeEmail: email,
                    empId,
                    managerName,
                    managerEmail,

                    // Save Level 1 Feedback Ratings
                    preTrainingRating,
                    postTrainingRating,
                    trainingRating,
                    contentRating,
                    trainerRating,
                    materialRating,
                    recommendationRating,

                    // Save Text Comments
                    topicsLearned,
                    actionPlan,
                    suggestions,

                    status: 'Pending', // Sets them up for the 25-day email later
                },
            });
        } else {
            // Optional: If they already exist, we could update their feedback
            // For now, we just let them through to the success page
            console.log("User already enrolled, skipping creation.");
        }

    } catch (error) {
        console.error("Enrollment Failed", error);
        // You could return { error: "Something went wrong" } here if you were using useFormState
        throw new Error("Database Error");
    }

    // 6. Redirect to Success Page
    redirect('/join/success');
}