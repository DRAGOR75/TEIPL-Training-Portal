'use server';

import { sendEmail } from '@/lib/email';

export interface BulkEmailResult {
    email: string;
    success: boolean;
    error?: string;
}

export async function sendBulkUserCredentials(
    name: string,
    email: string,
    empId: string,
    password: string,
    customSubject?: string,
    customHtml?: string
): Promise<BulkEmailResult> {
    if (!email || !empId || !password) {
        return { email, success: false, error: 'Missing required fields' };
    }

    const html = customHtml || `
    <div style="font-family: Georgia, serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0056b3; margin-top: 0;">Welcome to Thriveni Training Portal</h2>
      <p>Dear <strong>${name}</strong>,</p>
      
      <p>Greetings of the day!</p>
      
      <p>You have been registered on the Thriveni Training Portal. Please find your login credentials below:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Portal URL:</strong> <a href="https://training.thrivenisikshak.com/" target="_blank" style="color: #0056b3;">https://training.thrivenisikshak.com/</a></p>
        <p style="margin: 5px 0;"><strong>User ID:</strong> ${empId}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
      </div>

      <p>Please log in and change your password if prompted.</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">This is an automated message from the Thriveni Training Management System.</small>
    </div>
  `;

    const subject = customSubject || 'Your Login Credentials - Thriveni Training Portal';

    try {
        const result = await sendEmail({
            to: email,
            subject,
            html,
        });

        if (result.success) {
            return { email, success: true };
        } else {
            return { email, success: false, error: result.error || 'Failed to send email' };
        }
    } catch (error: any) {
        return { email, success: false, error: error.message || 'Unknown error' };
    }
}
