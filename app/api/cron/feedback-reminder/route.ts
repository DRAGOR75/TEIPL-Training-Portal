import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { sendTrainerReminderEmail } from '@/lib/email';

export const dynamic = 'force-dynamic'; // Ensure this route is never cached

export async function GET(req: NextRequest) {

    try {
        // 1. Find sessions where:
        //    - feedbackCreationDate is in the past (or today)
        //    - feedbackReminderSent is false
        //    - trainerName is present (so we can find their email)
        const sessionsToRemind = await db.trainingSession.findMany({
            where: {
                feedbackCreationDate: {
                    lte: new Date(),
                },
                feedbackReminderSent: false,
                trainerName: {
                    not: null,
                },
            },
        });

        if (sessionsToRemind.length === 0) {
            return NextResponse.json({ message: 'No trainer reminders to send.' }, { status: 200 });
        }

        const results = [];

        // 2. Iterate and send emails
        for (const session of sessionsToRemind) {
            if (!session.trainerName) continue;

            // Find Trainer Email
            const trainer = await db.trainer.findUnique({
                where: { name: session.trainerName },
            });

            if (trainer && trainer.email) {
                // Send Email
                const emailResult = await sendTrainerReminderEmail(
                    trainer.email,
                    session.programName,
                    session.startDate,
                    session.endDate
                );

                if (emailResult.success) {
                    // Update Session Flag
                    await db.trainingSession.update({
                        where: { id: session.id },
                        data: { feedbackReminderSent: true },
                    });
                    results.push({ session: session.programName, status: 'Sent', to: trainer.email });
                } else {
                    results.push({ session: session.programName, status: 'Failed', error: emailResult.error });
                }
            } else {
                results.push({ session: session.programName, status: 'Skipped', reason: 'Trainer email not found' });
            }
        }

        return NextResponse.json({
            success: true,
            processed: sessionsToRemind.length,
            details: results
        });

    } catch (error: any) {
        console.error('Feedback Reminder Cron Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
