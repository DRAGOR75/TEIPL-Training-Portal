import nodemailer from 'nodemailer';

// 1. Create the Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Ensure .env matches this variable name
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * GENERIC EMAIL FUNCTION
 * ---------------------------------------------------------
 * CRITICAL: This function is used by the Feedback System.
 * DO NOT MODIFY this function to ensure feedback emails 
 * continue to work without interruption.
 * ---------------------------------------------------------
 */
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Thriveni Training System" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`📧 Generic Email sent to ${to} (ID: ${info.messageId})`);
    return { success: true };
  } catch (error) {
    console.error('❌ Generic Email failed:', error);
    return { success: false, error };
  }
}

/**
 * NOMINATION APPROVAL FUNCTION
 * ---------------------------------------------------------
 * Updated to use the new secure Nomination ID link.
 * ---------------------------------------------------------
 */
export async function sendApprovalEmail(
  managerEmail: string,
  managerName: string,
  nomineeName: string,
  justification: string,
  nominationId: string // <--- NEW: Required to generate the correct link
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // ✅ NEW LINK: Points to the secure manager approval page
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

        <p>Your action is required to proceed with this nomination. Please click the button below to review, approve, or reject this request.</p>

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