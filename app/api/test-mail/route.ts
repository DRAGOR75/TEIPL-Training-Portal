import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET() {
    // --- 🔍 DEBUGGER START ---
    console.log("==========================================");
    console.log("DEBUG: Checking Environment Variables...");
    // Consistently using SMTP (Simple Mail Transfer Protocol)
    console.log("SMTP_USER:", process.env.SMTP_USER ? `'${process.env.SMTP_USER}'` : "❌ MISSING");
    console.log("SMTP_KEY Length:", process.env.SMTP_KEY ? process.env.SMTP_KEY.length : "❌ MISSING");

    if (process.env.SMTP_USER && process.env.SMTP_USER.endsWith(' ')) {
        console.log("⚠️ WARNING: SMTP_USER has a hidden space at the end!");
    }
    console.log("==========================================");
    // --- 🔍 DEBUGGER END ---

    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            // Updated variable names to match standard SMTP spelling
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_KEY,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await new Promise((resolve, reject) => {
            transporter.verify(function (error, success) {
                if (error) {
                    console.error("Transporter Verification Failed:", error);
                    reject(error);
                } else {
                    console.log("Transporter Verification Success!");
                    resolve(success);
                }
            });
        });

        const info = await transporter.sendMail({
            from: '"Vercel Debugger" <bvg@thriveni.com>',
            to: 'bvg@thriveni.com',
            subject: 'Brevo SMTP spelling Fix Test',
            html: `
                <div style="padding: 20px; font-family: sans-serif;">
                  <h2 style="color: green;">✅ SMTP Spelling Fixed!</h2>
                  <p>The code and .env are now perfectly aligned.</p>
                </div>
            `,
        });

        return NextResponse.json({ success: true, messageId: info.messageId });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || error,
            isAuthError: error.message.includes('535')
        }, { status: 500 });
    }
}