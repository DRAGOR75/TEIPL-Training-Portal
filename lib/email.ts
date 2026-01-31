import { google } from 'googleapis';
import { generateSecureToken } from '@/lib/security';

/**
 * Creates a Gmail API Client using OAuth2.
 * Uses REST API instead of SMTP for better reliability and bypassing port blocks.
 */
const clean = (val: string | undefined) => val ? val.replace(/^["']|["']$/g, '').trim() : undefined;

const getGmailClient = () => {
  const oAuth2Client = new google.auth.OAuth2(
    clean(process.env.GMAIL_CLIENT_ID),
    clean(process.env.GMAIL_CLIENT_SECRET),
    'https://developers.google.com/oauthplayground' // Redirect URL
  );

  oAuth2Client.setCredentials({
    refresh_token: clean(process.env.GMAIL_REFRESH_TOKEN),
  });

  return google.gmail({ version: 'v1', auth: oAuth2Client });
};

/**
 * HELPER: Get Base URL dynamically
 */
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://teipl-training-portal.vercel.app';
};

/**
 * CORE SENDER FUNCTION
 */
export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    const gmail = getGmailClient();
    const userEmail = clean(process.env.EMAIL_USER);

    // Construct the raw email
    // Headers must be ASCII. Use RFC 2047 encoding for the subject if it contains non-ASCII characters.
    const encodedSubject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

    const str = [
      `From: "Training Thriveni" <${userEmail}>`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      `Content-Type: text/html; charset=utf-8`,
      `MIME-Version: 1.0`,
      ``,
      html
    ].join('\n');

    // Encode the string to Base64URL format (Safe for URL)
    const encodedMessage = Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`✅ Email sent via API to ${to}: ${res.data.id}`);
    return { success: true, id: res.data.id };
  } catch (error: any) {
    console.error('❌ Email failed via API:', error);
    // Extract more meaningful error from Google API response if available
    const message = error.response?.data?.error?.message || error.message || error;
    return { success: false, error: message };
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
  const baseUrl = getBaseUrl();
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
  const baseUrl = getBaseUrl();
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
  const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const startDateStr = dateFormatter.format(startDate);
  const endDateStr = dateFormatter.format(endDate);
  const baseUrl = getBaseUrl();

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #d32f2f;">Reminder: Post-Training Feedback Deadline</h2>
      
      <p>This is a reminder to please proceed for the Post Training Feedback for <strong>${programName}</strong> conducted on <strong>${startDateStr}</strong> to <strong>${endDateStr}</strong>.</p>
      <p>Please ensure to collect the post training feedback from all the participants within next 5 days.</p>
      <p>You can initiate the feedback collection process by clicking the link below:</p>
      <p><a href="${baseUrl}/admin/dashboard/" style="background: #d32f2f; color: white; padding: 12px 25px; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Initiate Feedback Collection</a></p>
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
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Rate your knowledge level BEFORE training:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.preTraining}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Rate your knowledge level After training:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.postTraining}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>How would you rate the overall training?:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.training}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>How would you rate the content?:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.content}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>How would you rate the trainer?:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.trainer}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>How would you rate the material?:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${feedbackData.material}/5</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Would you recommend this training to others?:</strong></td>
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
      <small style="color: #888;">This is an automated message from Training Thriveni.</small>
    </div>`;

  return await sendEmail({ to: email, subject: `Feedback Received: ${programName}`, html });
}

/**
 * EMAIL FOR COORDINATORS (Manager Rejection/Disagreement)
 */
export async function sendManagerRejectionNotification(
  managerName: string,
  employeeName: string,
  programName: string,
  managerComment: string,
  trainerEmail?: string | null
) {
  const coordinators = ['pln@thriveni.com', 'goraibaibhav161@gmail.com', 'ssd@thriveni.com'];
  if (trainerEmail) {
    coordinators.push(trainerEmail);
  }

  const subject = `Urgent: Manager Disagreed with Feedback - ${employeeName}`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #d32f2f; border-radius: 8px;">
      <h2 style="color: #d32f2f;">Manager Disagreement Alert</h2>
      <p>The manager <strong>${managerName}</strong> has reviewed the post-training feedback for <strong>${employeeName}</strong> for (${programName}) and disagrees with the comments.</p>
      
      <div style="background: #fff5f5; padding: 15px; border-left: 4px solid #d32f2f; margin: 15px 0;">
        <strong>Manager's Comments:</strong><br/>
        ${managerComment}
      </div>

      <p>Please review this candidate's feedback status immediately.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">Automated Notification</small>
    </div>`;

  // Send to all coordinators (and trainer)
  const promises = coordinators.map(email =>
    sendEmail({ to: email, subject, html })
  );


  await Promise.all(promises);
  return { success: true };
}

/**
 * EMAIL FOR MANAGER (Feedback Review Request)
 */
export async function sendFeedbackReviewRequestEmail(
  managerEmail: string,
  managerName: string | null,
  employeeName: string,
  programName: string,
  enrollmentId: string
) {
  const baseUrl = getBaseUrl();
  const token = generateSecureToken(enrollmentId);
  const managerLink = `${baseUrl}/feedback/manager/${enrollmentId}?token=${token}`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0056b3;">Post training (30 days) performance feedback</h2>
      <p>Dear <strong>${managerName || 'Manager'}</strong>,</p>
      <p>The employee <strong>${employeeName}</strong> has submitted their post-training (30 days) performance feedback for the program <strong>${programName}</strong>.</p>
      <p>Please review their ratings and provide your validation by clicking the button below:</p>
      <p><a href="${managerLink}" style="background: #0056b3; color: white; padding: 12px 25px; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Review Feedback</a></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">This is an automated message from Training Thriveni.</small>
    </div>`;

  return await sendEmail({
    to: managerEmail,
    subject: `Action Required: Feedback Review for ${employeeName}`,
    html
  });
}

/**
 * EMAIL FOR MANAGER (TNI Nomination Approval)
 */
export async function sendTNIApprovalEmail(
  managerEmail: string,
  managerName: string | null,
  employeeName: string,
  programs: string[],
  justification: string,
  empId: string
) {
  const baseUrl = getBaseUrl();
  const token = generateSecureToken(empId);
  const approvalLink = `${baseUrl}/nominations/manager/${empId}?token=${token}`;

  const programsList = programs.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('');

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0056b3;">Action Required: TNI Nomination Approval</h2>
      <p>Dear <strong>${managerName || 'Manager'}</strong>,</p>
      <p><strong>${employeeName}</strong> has submitted nominations for the following training programs:</p>
      
      <ul style="background: #f0f7ff; padding: 15px 15px 15px 30px; border-radius: 6px; color: #333;">
        ${programsList}
      </ul>

      <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #0056b3; margin: 15px 0;">
        <strong>Justification:</strong><br/>
        <em style="color: #555;">"${justification}"</em>
      </div>

      <p>Please review these requests and provide your approval or rejection.</p>
      <p><a href="${approvalLink}" style="background: #0056b3; color: white; padding: 12px 25px; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Review Nominations</a></p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">This is an automated message from Training Thriveni.</small>
    </div>`;

  return await sendEmail({
    to: managerEmail,
    subject: `Action Required: TNI Nomination Approval for ${employeeName}`,
    html
  });
}

/**
 * EMAIL FOR MANAGER (Training Session Approval)
 */
export async function sendManagerSessionApprovalEmail(
  managerEmail: string,
  managerName: string | null,
  employeeName: string,
  programName: string,
  startDate: Date,
  endDate: Date,
  nominationId: string
) {
  const baseUrl = getBaseUrl();
  const token = generateSecureToken(nominationId);
  const approvalLink = `${baseUrl}/manager/approval/${nominationId}?token=${token}`;

  const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const startDateStr = dateFormatter.format(startDate);
  const endDateStr = dateFormatter.format(endDate);

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0056b3;">Training Nomination Approval Required</h2>
      <p>Dear <strong>${managerName || 'Manager'}</strong>,</p>
      <p>Your team member <strong>${employeeName}</strong> has been selected for the following training session:</p>
      
      <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0056b3; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0056b3; margin-bottom: 10px;">${programName}</h3>
        <p style="margin: 5px 0;"><strong>Start Date:</strong> ${startDateStr}</p>
        <p style="margin: 5px 0;"><strong>End Date:</strong> ${endDateStr}</p>
      </div>

      <p>As their manager, please review and approve or reject their participation. If rejecting, you will be required to provide a reason.</p>
      
      <div style="margin: 25px 0;">
        <a href="${approvalLink}" style="background-color: #0056b3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Review Request</a>
      </div>

      <p style="font-size: 13px; color: #666;">Note: This action is required to finalize their enrollment.</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">This is an automated message from the Thriveni Training Management System.</small>
    </div>`;

  return await sendEmail({
    to: managerEmail,
    subject: `Approval Required: Training Session for ${employeeName}`,
    html
  });
}
