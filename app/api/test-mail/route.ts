import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic'; // Ensures Vercel doesn't cache this route

export async function GET() {
    console.log("Starting Hardcoded Brevo Test...");

    // 1. Setup Transporter with HARDCODED Credentials
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_KEY,
        },
        tls: {
            rejectUnauthorized: false // Helps avoid some Vercel SSL handshake errors
        }
    });

    try {
        // 2. Verify Connection First
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

        // 3. Send Email
        const info = await transporter.sendMail({
            from: '"Vercel Debugger" <bvg@thriveni.com>',
            to: 'bvg@thriveni.com',
            subject: 'Brevo Hardcoded Test - Vercel',
            html: `
        <div style="padding: 20px; font-family: sans-serif;">
          <h2 style="color: green;">It Works!</h2>
          <p>If you are reading this, your Brevo credentials are correct.</p>
          <p><strong>Environment:</strong> Vercel / Production</p>
        </div>
      `,
        });

        console.log("Email sent: ", info.messageId);
        return NextResponse.json({ success: true, messageId: info.messageId });

    } catch (error: any) {
        console.error("Hardcoded Send Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || error,
            stack: error.stack
        }, { status: 500 });
    }
}