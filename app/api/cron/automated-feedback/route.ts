import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }
    try {
        // Automation logic for Participant Feedback Emails
        const sessionsForFeedback = await db.trainingSession.findMany({
            where: {
                sendFeedbackAutomatically: true,
                emailsSent: false,
                feedbackCreationDate: {
                    lte: new Date(),
                }
            },
            include: { enrollments: true }
        });

        if (sessionsForFeedback.length === 0) {
            return NextResponse.json({ message: 'No automated feedback sessions to process.' }, { status: 200 });
        }

        const results = [];

        for (const session of sessionsForFeedback) {
            // Dynamic import to avoid potential circular dependencies if any
            const { sendFeedbackEmails } = await import('@/app/actions');

            try {
                const result = await sendFeedbackEmails(session.id);

                if (result.success) {
                    results.push({
                        session: session.programName,
                        status: 'Sent',
                        message: result.message
                    });
                } else {
                    results.push({
                        session: session.programName,
                        status: 'Failed',
                        error: result.error
                    });
                }
            } catch (err: any) {
                results.push({
                    session: session.programName,
                    status: 'Error',
                    error: err.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            processed: sessionsForFeedback.length,
            details: results
        });

    } catch (error: any) {
        console.error('Automated Feedback Cron Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
