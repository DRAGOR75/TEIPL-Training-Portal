import nodemailer from 'nodemailer';

/**
 * Creates a Nodemailer transporter using Brevo SMTP.
 * Replaces Gmail App Password for better deliverability and fewer blocks.
 */
const clean = (val: string | undefined) => val ? val.replace(/^["']|["']$/g, '').trim() : undefined;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: clean(process.env.GMAIL_USER_EMAIL) || clean(process.env.EMAIL_USER),
    clientId: clean(process.env.GMAIL_CLIENT_ID),
    clientSecret: clean(process.env.GMAIL_CLIENT_SECRET),
    refreshToken: clean(process.env.GMAIL_REFRESH_TOKEN),
  },
  // Keeps the connection alive for multiple messages (optional but good for performance)
  pool: true,
  maxConnections: 5, // Allow 5 simultaneous connections for batch sending
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
      from: `"Training Thriveni" <${clean(process.env.EMAIL_USER)}>`, // Must be verified in Brevo
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
  // Hardcoded Production URL for reliability
  const baseUrl = 'https://templtrainingportal.vercel.app';
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
  // Hardcoded Production URL for reliability
  const baseUrl = 'https://templtrainingportal.vercel.app';
  const feedbackLink = `${baseUrl}/feedback/employee/${enrollmentId}`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #2e7d32;">Post training (30 days) performance feedback</h2>
      <p>Dear <strong>${employeeName}</strong>,</p>
      <p>Thank you for participating in the <strong>${programName}</strong> program.</p>
      <p>Your feedback is valuable to us. Please click the button below to submit your evaluation:</p>
      <p><a href="${feedbackLink}" style="background: #2e7d32; color: white; padding: 12px 25px; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Submit Feedback</a></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">This is an automated message from the Thriveni Training Management System.</small>
    </div>`;

  return await sendEmail({ to: employeeEmail, subject: `Action Required: Post training (30 days) performance feedback for ${programName}`, html });
}

/**
 * EMAIL FOR TRAINERS (Reminder)
 */
export async function sendTrainerReminderEmail(
  trainerEmail: string,
  programName: string,
  startDate: Date,
  endDate: Date
) {
  const startDateStr = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const endDateStr = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #d32f2f;">Reminder: Post-Training Feedback Deadline</h2>
      
      <p>This is a reminder to please proceed for the Post Training Feedback for <strong>${programName}</strong> conducted on <strong>${startDateStr}</strong> to <strong>${endDateStr}</strong>.</p>
      <p>Please ensure to collect the post training feedback from all the participants within next 5 days.</p>
      <p>You can initiate the feedback collection process by clicking the link below:</p>
      <p><a href="https://templtrainingportal.vercel.app/admin/dashboard/" style="background: #d32f2f; color: white; padding: 12px 25px; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Initiate Feedback Collection</a></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">This is an automated message from the Thriveni Training Management System.</small>
    </div>`;

  return await sendEmail({ to: trainerEmail, subject: `Reminder: Post-Training Feedback Deadline - ${programName}`, html });
}


/**
 * EMAIL FOR EMPLOYEES (Feedback Acknowledgment)
 */
export async function sendFeedbackAcknowledgmentEmail(
  email: string,
  name: string,
  programName: string,
  feedbackData: {
    preTraining: number;
    postTraining: number;
    training: number;
    content: number;
    trainer: number;
    material: number;
    recommendation: boolean;
    topicsLearned: string;
    actionPlan: string;
    suggestions: string;
  }
) {
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0056b3;">Feedback Received</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for submitting your feedback for the training program <strong>${programName}</strong>.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #333;">Your Responses</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Pre-Training Rating:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.preTraining}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Post-Training Rating:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.postTraining}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Training Rating:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.training}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Content Rating:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.content}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Trainer Rating:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.trainer}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Material Rating:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.material}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Recommendation:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.recommendation ? 'Yes' : 'No'}</td>
          </tr>
        </table>

        <div style="margin-top: 15px;">
          <p><strong>Topics Learned:</strong><br/>${feedbackData.topicsLearned || 'N/A'}</p>
          <p><strong>Action Plan:</strong><br/>${feedbackData.actionPlan || 'N/A'}</p>
          <p><strong>Suggestions:</strong><br/>${feedbackData.suggestions || 'N/A'}</p>
        </div>
      </div>

      <p>We appreciate your time and input.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">This is an automated message from the Thriveni Training Management System.</small>
    </div>`;

  return await sendEmail({ to: email, subject: `Feedback Received: ${programName}`, html });
}
