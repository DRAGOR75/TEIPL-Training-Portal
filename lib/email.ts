import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

/**
 * 1. OAUTH2 HANDSHAKE UTILITY
 * This fetches a fresh access token using your Refresh Token
 */
const getOAuthTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  // Automatically fetch a fresh temporary key
  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) reject("Failed to create access token :(");
      resolve(token);
    });
  });

  // Create the professional transporter
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

/**
 * HELPER: Get the Base URL (Production Safe)
 */
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return 'https://templtrainingportal.vercel.app';
};

/**
 * GENERIC EMAIL FUNCTION (Now using OAuth2)
 */
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = await getOAuthTransporter(); //
    const info = await transporter.sendMail({
      from: `"Thriveni Training System" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`📧 OAuth2 Email sent to ${to} (ID: ${info.messageId})`);
    return { success: true };
  } catch (error) {
    console.error('❌ OAuth2 Email failed:', error);
    return { success: false, error };
  }
}

/**
 * 1. NOMINATION APPROVAL FUNCTION (For Managers)
 */
export async function sendApprovalEmail(
  managerEmail: string,
  managerName: string,
  nomineeName: string,
  justification: string,
  nominationId: string
) {
  const baseUrl = getBaseUrl();
  const approvalLink = `${baseUrl}/nominations/manager/${nominationId}`;

  const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px;">Nomination Approval Request</h2>
        <p>Dear <strong>${managerName}</strong>,</p>
        <p>A new training nomination has been submitted for <strong style="color: #2c3e50;">${nomineeName}</strong>.</p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #0056b3; padding: 15px; margin: 20px 0;">
          <strong style="display: block; margin-bottom: 5px; color: #555;">Justification / Details:</strong>
          <span style="font-style: italic; color: #333;">${justification.replace(/\n/g, '<br/>')}</span>
        </div>
        <p>Your action is required to proceed. Please click the button below to review this request.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalLink}" style="background-color: #0056b3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            Review & Take Action
          </a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; text-align: center;">Thriveni Training & Development System</p>
      </div>
    `;

  return await sendEmail(managerEmail, `Action Required: Nomination Approval for ${nomineeName}`, html);
}

/**
 * 2. FEEDBACK REQUEST EMAIL (For Employees)
 */
export async function sendFeedbackRequestEmail(
  employeeEmail: string,
  employeeName: string,
  programName: string,
  enrollmentId: string
) {
  const baseUrl = getBaseUrl();
  const feedbackLink = `${baseUrl}/feedback/employee/${enrollmentId}`;

  const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 10px;">Training Feedback Request</h2>
        <p>Dear <strong>${employeeName}</strong>,</p>
        <p>You recently completed: <strong style="color: #2c3e50;">${programName}</strong>.</p>
        <p>We value your feedback! Please click below to rate the effectiveness of this training.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${feedbackLink}" style="background-color: #2e7d32; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            Submit Feedback
          </a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; text-align: center;">Thriveni Training & Development System</p>
      </div>
    `;

  return await sendEmail(employeeEmail, `Feedback Required: ${programName}`, html);
}