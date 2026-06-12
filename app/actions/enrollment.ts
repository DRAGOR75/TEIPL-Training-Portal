'use server'

import { db } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from "next/cache";
import { sendFeedbackAcknowledgmentEmail } from "@/lib/email";

export async function selfEnroll(formData: FormData) {
    const sessionId = formData.get('sessionId') as string;
    const empId = formData.get('empId') as string;

    if (!sessionId || !empId) {
        throw new Error("Missing Required Fields");
    }

    try {
        // 1. Fetch Session to check walk-in rules
        const session = await db.trainingSession.findUnique({
            where: { id: sessionId },
            select: { 
                programName: true, 
                allowWalkIns: true,
                nominationBatchId: true,
                startDate: true,
                endDate: true,
                trainerName: true,
                location: true
            }
        });

        if (!session) throw new Error("Invalid Session");

        // 2. Determine Identity
        let finalName = '';
        let finalEmail = '';
        let finalManagerName = '';
        let finalManagerEmail = '';

        if (empId === 'WALKIN') {
            if (!session.allowWalkIns) {
                throw new Error("Walk-ins are not permitted for this session.");
            }
            finalName = formData.get('name') as string;
            finalEmail = formData.get('email') as string;
            finalManagerName = formData.get('managerName') as string;
            finalManagerEmail = formData.get('managerEmail') as string;
        } else {
            // Secure DB Lookup
            const employee = await db.employee.findUnique({
                where: { id: empId }
            });
            if (!employee) throw new Error("Employee not found in Master Database.");

            finalName = employee.name;
            finalEmail = employee.email;
            finalManagerName = employee.managerName || '';
            finalManagerEmail = employee.managerEmail || '';
        }

        if (!finalEmail || !finalName) {
            throw new Error("Could not resolve participant details.");
        }

        // 3. Extract Feedback Data
        const data = {
            sessionId,
            employeeName: finalName,
            employeeEmail: finalEmail,
            empId: empId === 'WALKIN' ? null : empId,
            managerName: finalManagerName,
            managerEmail: finalManagerEmail,
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

        // 4. Upsert Logic
        await db.enrollment.upsert({
            where: {
                sessionId_employeeEmail: {
                    sessionId,
                    employeeEmail: finalEmail
                }
            },
            update: data,
            create: data
        });

        // 4.5. Close TNI Loop & Create Training History (Moved from 30-day feedback)
        if (empId !== 'WALKIN' && session.nominationBatchId) {
            let empLocation = null;
            const emp = await db.employee.findUnique({ where: { id: empId }, select: { location: true } });
            empLocation = emp?.location;

            const prog = await db.program.findUnique({ where: { name: session.programName }, select: { category: true } });
            const progCategory = prog?.category ?? null;

            const start = new Date(session.startDate);
            const end = new Date(session.endDate);
            const trainingDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

            // Mark Nomination as Completed
            await db.nomination.updateMany({
                where: { empId: empId, batchId: session.nominationBatchId },
                data: { status: 'Completed' }
            });

            // Create Training History if it doesn't exist
            const existingHistory = await db.trainingHistory.findFirst({
                where: { empId: empId, sessionId: sessionId }
            });

            if (!existingHistory) {
                await db.trainingHistory.create({
                    data: {
                        empId: empId,
                        employeeName: finalName,
                        programName: session.programName,
                        startDate: session.startDate,
                        endDate: session.endDate,
                        trainingDays: trainingDays > 0 ? trainingDays : null,
                        location: session.location || empLocation,
                        progCategory: progCategory,
                        source: 'SYSTEM',
                        sessionId: sessionId,
                        trainerName: session.trainerName
                    }
                });
            }
        }

        // 5. Send Acknowledgment Email (Non-blocking)
        if (formData.get('isAdmin') !== 'true') {
            await sendFeedbackAcknowledgmentEmail(finalEmail, finalName, session.programName, {
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
            }).catch(err => console.error("Ack Email failed", err));
        }

    } catch (error) {
        console.error("Enrollment Failed", error);
        throw new Error("Database Error");
    }

    // 6. Redirect to success page
    redirect('/join/success');
}