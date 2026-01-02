import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const clean = (val: string | undefined) => val ? val.replace(/^["']|["']$/g, '').trim() : undefined;

        const clientId = clean(process.env.GMAIL_CLIENT_ID);
        const clientSecret = clean(process.env.GMAIL_CLIENT_SECRET);
        const refreshToken = clean(process.env.GMAIL_REFRESH_TOKEN);
        const userEmail = clean(process.env.GMAIL_USER_EMAIL) || clean(process.env.EMAIL_USER);

        // 1. Validate Environment Variables
        if (!clientId || !clientSecret || !refreshToken || !userEmail) {
            return NextResponse.json({
                success: false,
                error: "Missing Required Environment Variables",
                missingVars: {
                    GMAIL_CLIENT_ID: !clientId,
                    GMAIL_CLIENT_SECRET: !clientSecret,
                    GMAIL_REFRESH_TOKEN: !refreshToken,
                    GMAIL_USER_EMAIL_OR_EMAIL_USER: !userEmail
                },
                hint: "Please ensure GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN are set. For the email, set either GMAIL_USER_EMAIL or EMAIL_USER."
            }, { status: 400 });
        }

        // 2. Configure Transporter with OAuth2
        // Nodemailer handles the access token generation automatically if refreshToken is provided.
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: userEmail,
                clientId: clientId,
                clientSecret: clientSecret,
                refreshToken: refreshToken,
            },
        });

        // 3. Verify Connection (Optional but good for debugging)
        console.log("Verifying Gmail OAuth connection...");
        console.log(`Debug - User: ${userEmail}`);

        await new Promise((resolve, reject) => {
            transporter.verify((error, success) => {
                if (error) {
                    console.error("Transporter Verification Failed:", error);
                    reject(error);
                } else {
                    console.log("Transporter Verification Success!");
                    resolve(success);
                }
            });
        });

        // 4. Send Test Email
        const info = await transporter.sendMail({
            from: `"Gmail OAuth Test" <${userEmail}>`,
            to: userEmail, // Sending to self for testing
            subject: "✅ Gmail API OAuth2 Test Success",
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0f9d58; margin-top: 0;">Test Successful</h2>
                    <p>This email confirms that your <strong>Gmail API with OAuth2</strong> configuration is working correctly.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 0.9em; color: #555;"><strong>Credentials verified:</strong></p>
                        <ul style="margin: 5px 0 0 0; font-size: 0.9em; color: #333;">
                            <li>Client ID: (Present)</li>
                            <li>Refresh Token: (Present)</li>
                            <li>User: ${userEmail}</li>
                        </ul>
                    </div>

                    <p style="color: #888; font-size: 0.8em; margin-top: 20px;">
                        Sent via app/api/test-gmail-oauth/route.ts
                    </p>
                </div>
            `
        });

        console.log("Email sent:", info.messageId);

        return NextResponse.json({
            success: true,
            message: "Email sent successfully via Gmail OAuth2",
            messageId: info.messageId,
            response: info.response,
            envelope: info.envelope
        });

    } catch (error: any) {
        console.error("Gmail OAuth Route Error:", error);

        const isAuthError = error.response?.includes('535') || error.message?.includes('Username and Password not accepted');

        return NextResponse.json({
            success: false,
            error: error.message || "Unknown error occurred",
            code: error.code,
            command: error.command,
            help: isAuthError ? "Authentication Failed (535). Common causes: 1) The 'user' email in .env does not match the account that generated the Refresh Token. 2) The Refresh Token is expired or invalid. 3) Scopes were not granted." : undefined,
            debug: {
                userBeingUsed: process.env.GMAIL_USER_EMAIL || process.env.EMAIL_USER,
                clientIdPrefix: process.env.GMAIL_CLIENT_ID?.substring(0, 5) + "..."
            }
        }, { status: 500 });
    }
}
