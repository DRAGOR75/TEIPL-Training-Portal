import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

const getOAuthTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) reject("Failed to create access token :(");
      resolve(token);
    });
  });

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      accessToken,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  } as any);
};

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = await getOAuthTransporter();
    const info = await transporter.sendMail({
      from: `"Thriveni Training System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email failed:', error);
    return { success: false, error };
  }
}

/**
 * EMAIL FOR MANAGERS (Nominations)
 */
export async function sendApprovalEmail(
  managerEmail: string,
  managerName: string,
  employeeName: string, // Match schema
  justification: string,
  nominationId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approvalLink = `${baseUrl}/nominations/manager/${nominationId}`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #0056b3;">Nomination Approval Request</h2>
      <p>Dear <strong>${managerName}</strong>,</p>
      <p>A training nomination is submitted for <strong>${employeeName}</strong>.</p>
      <div style="background: #f9f9f9; padding: 10px; border-left: 4px solid #0056b3;">
        <strong>Justification:</strong><br/>${justification}
      </div>
      <p><a href="${approvalLink}" style="background: #0056b3; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 15px;">Review & Approve</a></p>
    </div>`;

  return await sendEmail(managerEmail, `Action Required: Nomination for ${employeeName}`, html);
}

/**
 * EMAIL FOR EMPLOYEES (Feedback)
 */
export async function sendFeedbackRequestEmail(
  employeeEmail: string,
  employeeName: string, // Match schema
  programName: string,
  enrollmentId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const feedbackLink = `${baseUrl}/feedback/employee/${enrollmentId}`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #2e7d32;">Training Feedback Request</h2>
      <p>Dear <strong>${employeeName}</strong>,</p>
      <p>Please provide your feedback for: <strong>${programName}</strong>.</p>
      <p><a href="${feedbackLink}" style="background: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 15px;">Submit Feedback</a></p>
    </div>`;

  return await sendEmail(employeeEmail, `Feedback Required: ${programName}`, html);
}