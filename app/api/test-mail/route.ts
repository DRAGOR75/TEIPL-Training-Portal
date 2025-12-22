// app/api/test-mail/route.ts
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email'; // Ensure this matches your file name (email.ts or mail.ts)

export async function GET() {
    console.log("🚀 Manual Test Triggered for:", process.env.EMAIL_USER);

    try {
        // We now pass an object { to, subject, html } as required by your new lib/email.ts
        const result = await sendEmail({
            to: process.env.EMAIL_USER || '',
            subject: "Thriveni Portal: Final Handshake Test",
            html: `
        <div style="font-family: sans-serif; padding: 20px; border: 5px solid #0056b3; border-radius: 10px;">
          <h1 style="color: #0056b3;">✅ Connection Verified!</h1>
          <p>This test confirms that your <b>Localhost</b> and <b>Vercel</b> environments are now trusted by Google.</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <hr/>
          <p style="font-size: 12px; color: #666;">Thriveni Training Management System - Junior Officer Portal</p>
        </div>
      `
        });

        if (result.success) {
            return NextResponse.json({
                message: "Success! Check your inbox.",
                sender: process.env.EMAIL_USER
            });
        } else {
            return NextResponse.json({
                error: "Handshake Failed",
                details: result.error
            }, { status: 500 });
        }
    } catch (err: any) {
        return NextResponse.json({
            error: "Server Crash",
            details: err.message
        }, { status: 500 });
    }
}