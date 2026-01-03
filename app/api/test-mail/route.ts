import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userEmail = process.env.EMAIL_USER?.replace(/^["']|["']$/g, '').trim();

        if (!userEmail) {
            return NextResponse.json({ success: false, error: "EMAIL_USER not set" }, { status: 500 });
        }

        console.log("Testing Gmail API via sendEmail...");

        const result = await sendEmail({
            to: userEmail,
            subject: '✅ Gmail API Integration Test',
            html: `
                <div style="padding: 20px; font-family: sans-serif; border: 1px solid #ddd; border-radius: 8px;">
                  <h2 style="color: #0f9d58;">Gmail API Working!</h2>
                  <p>This email was sent using the Googleapis REST client, bypassing SMTP.</p>
                  <p>If you see this, the migration in <code>lib/email.ts</code> is successful.</p>
                </div>
            `,
        });

        if (result.success) {
            return NextResponse.json({ success: true, messageId: result.id });
        } else {
            throw new Error(String(result.error));
        }

    } catch (error: any) {
        console.error("Test Route Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || error,
        }, { status: 500 });
    }
}