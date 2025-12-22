import nodemailer from 'nodemailer';

/**
 * Creates a standard Nodemailer transporter using an App Password.
 * This bypasses OAuth complexity for immediate reliability.
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER, // Your @thriveni.com email
    pass: process.env.EMAIL_PASS, // Your 16-character App Password
  },
  // Keeps the connection alive for multiple messages (optional but good for performance)
  pool: true,
  maxConnections: 1,
});

/**
 * CORE SENDER FUNCTION
 */
export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    // Verify connection before sending (optional, helps debugging)
    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        if (error) reject(error);
        else resolve(success);
      });
    });

    const info = await transporter.sendMail({
      from: `"Thriveni Training System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Email failed:', error);
    return { success: false, error: error.message || error };
  }
}

/**
 * EMAIL FOR MANAGERS (Nominations)
 */
export async function sendApprovalEmail(
  managerEmail: string,
  managerName: string,
  employeeName: string,
  justification: string,
  nominationId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approvalLink = `${baseUrl}/nominations/manager/${nominationId}`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0056b3;">Nomination Approval Request</h2>
      <p>Dear <strong>${managerName}</strong>,</p>
      <p>A training nomination has been submitted for <strong>${employeeName}</strong>.</p>
      <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #0056b3; margin: 15px 0;">
        <strong>Justification:</strong><br/>${justification}
      </div>
      <p>Please review the details and provide your decision below:</p>
      <p><a href="${approvalLink}" style="background: #0056b3; color: white; padding: 12px 25px; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Review & Approve</a></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">This is an automated message from the Thriveni Training Management System.</small>
    </div>`;

  return await sendEmail({ to: managerEmail, subject: `Action Required: Nomination for ${employeeName}`, html });
}

/**
 * EMAIL FOR EMPLOYEES (Feedback)
 */
export async function sendFeedbackRequestEmail(
  employeeEmail: string,
  employeeName: string,
  programName: string,
  enrollmentId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const feedbackLink = `${baseUrl}/feedback/employee/${enrollmentId}`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #2e7d32;">Training Feedback Request</h2>
      <p>Dear <strong>${employeeName}</strong>,</p>
      <p>Thank you for participating in the <strong>${programName}</strong> program.</p>
      <p>Your feedback is valuable to us. Please click the button below to submit your evaluation:</p>
      <p><a href="${feedbackLink}" style="background: #2e7d32; color: white; padding: 12px 25px; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Submit Feedback</a></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">This is an automated message from the Thriveni Training Management System.</small>
    </div>`;

  return await sendEmail({ to: employeeEmail, subject: `Feedback Required: ${programName}`, html });
}