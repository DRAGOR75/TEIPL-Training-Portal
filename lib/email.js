// lib/email.js
import nodemailer from 'nodemailer';

export async function sendApprovalEmail(managerEmail, managerName, nomineeName, justification) {

    // Create the transporter (configure this with your email provider)
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or your provider
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // ✅ FIX: Added &action=approve and &action=reject
    const approveLink = `${baseUrl}/api/approve?email=${encodeURIComponent(managerEmail)}&nominee=${encodeURIComponent(nomineeName)}&action=approve`;
    const rejectLink = `${baseUrl}/api/approve?email=${encodeURIComponent(managerEmail)}&nominee=${encodeURIComponent(nomineeName)}&action=reject`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: managerEmail,
        subject: `Action Required: Nomination Approval for ${nomineeName}`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #0056b3;">Nomination Approval Request</h2>
        <p>Dear ${managerName},</p>
        <p>A new training nomination has been submitted for <strong>${nomineeName}</strong>.</p>
        
        <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #0056b3;">
          <strong>Justification:</strong><br/>
          ${justification}
        </blockquote>

        <p>Please review and take action:</p>

        <div style="margin: 30px 0;">
          <a href="${approveLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 15px; font-weight: bold;">
            ✅ Approve
          </a>
          
          <a href="${rejectLink}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            ❌ Reject
          </a>
        </div>

        <p style="font-size: 0.9em; color: #666;">
          Note: If you do not approve or reject, this nomination will remain pending.
        </p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${managerEmail}`);
    } catch (error) {
        console.error('❌ Email sending failed:', error);
    }
}