// src/utils/notificationEmails.js
import { ENV } from "../config/env.js";
import { sendEmail } from "./sendEmail.js";

const ADMIN_EMAIL = "markarianc@gmail.com";

function baseEmailTemplate({ title, messageLines = [], buttonLabel, buttonHref }) {
  const messageHtml = messageLines
    .map(
      (line) =>
        `<p style="margin:0 0 8px 0; font-size:14px; line-height:1.5; color:#111827;">${line}</p>`
    )
    .join("");

  const safeHref = buttonHref || ENV.BASE_URL || "#";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px; background:#ffffff; border-radius:8px; box-shadow:0 1px 3px rgba(15,23,42,0.08); overflow:hidden;">
            <tr>
              <td style="padding:20px 24px; border-bottom:1px solid #e5e7eb; background:#111827;">
                <h1 style="margin:0; font-size:18px; font-weight:600; color:#f9fafb;">One West Group</h1>
                <p style="margin:4px 0 0 0; font-size:12px; color:#d1d5db;">Marketing Requests Platform</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 12px 0; font-size:16px; font-weight:600; color:#111827;">${title}</h2>
                ${messageHtml}
                ${
                  buttonLabel && safeHref
                    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                        <tr>
                          <td align="left">
                            <a href="${safeHref}" style="display:inline-block; padding:10px 18px; background-color:#111827; color:#f9fafb; text-decoration:none; border-radius:6px; font-size:14px; font-weight:500;">
                              ${buttonLabel}
                            </a>
                          </td>
                        </tr>
                      </table>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px; border-top:1px solid #e5e7eb;">
                <p style="margin:0 0 4px 0; font-size:11px; color:#6b7280;">
                  This is an automated message from the One West Group marketing request system.
                </p>
                <p style="margin:0; font-size:11px; color:#6b7280;">
                  This platform is proudly developed by <strong>Saad&apos;s Production</strong> — real estate marketing tech experts.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}


export async function sendNewRequestNotificationEmail(data) {
  const {
    recipient,
    recipientEmail,
    requestId,
    agentName,
    agentEmail,
    requestTitle,
    templateTitle,
    templateCategory,
    platforms,
    dimensions,
    deadline,
    notes,
    filesCount,
    submittedAt,
  } = data;

  let toEmail, subject, htmlContent;

  if (recipient === "admin") {
    toEmail = "ranagee444732@gmail.com";
    subject = `🔔 New Request Submitted: ${requestTitle}`;
    
    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0;
              opacity: 0.9;
              font-size: 14px;
            }
            .content {
              padding: 30px;
            }
            .alert-box {
              background: #f0f9ff;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin-bottom: 25px;
              border-radius: 4px;
            }
            .alert-box p {
              margin: 0;
              color: #1e40af;
              font-weight: 500;
            }
            .details-section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
            }
            .detail-row {
              display: flex;
              padding: 12px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #6b7280;
              width: 140px;
              flex-shrink: 0;
            }
            .detail-value {
              color: #1f2937;
              flex: 1;
            }
            .platforms-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 5px;
            }
            .platform-tag {
              background: #ede9fe;
              color: #6b21a8;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 13px;
              font-weight: 500;
            }
            .notes-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin-top: 10px;
              border-radius: 4px;
              font-style: italic;
              color: #78350f;
            }
            .files-badge {
              display: inline-block;
              background: #dcfce7;
              color: #166534;
              padding: 6px 12px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin-top: 20px;
              text-align: center;
            }
            .footer {
              background: #f9fafb;
              padding: 20px 30px;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            
            <div class="content">
              <div class="details-section">
                <div class="section-title"> Requester Information</div>
                <div class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">${agentName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${agentEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Submitted:</span>
                  <span class="detail-value">${submittedAt}</span>
                </div>
              </div>

              <div class="details-section">
                <div class="section-title">Project Details</div>
                <div class="detail-row">
                  <span class="detail-label">Project Title:</span>
                  <span class="detail-value"><strong>${requestTitle}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Template:</span>
                  <span class="detail-value">${templateTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Category:</span>
                  <span class="detail-value">${templateCategory}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Deadline:</span>
                  <span class="detail-value"><strong>${deadline}</strong></span>
                </div>
                ${dimensions ? `
                <div class="detail-row">
                  <span class="detail-label">Dimensions:</span>
                  <span class="detail-value">${dimensions}</span>
                </div>
                ` : ''}
              </div>

              <div class="details-section">
                <div class="section-title"> Attachments</div>
                <span class="files-badge">
                  ${filesCount} ${filesCount === 1 ? 'File' : 'Files'} Attached
                </span>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.ADMIN_DASHBOARD_URL || '#'}/requests/${requestId}" class="button">
                  View Full Request →
                </a>
              </div>
            </div>

            <div class="footer">
              <p><strong>Mar Lease BE</strong> - Design Management System</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    toEmail = recipientEmail;
    subject = `Request Submitted Successfully: ${requestTitle}`;
    
    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0;
              opacity: 0.9;
              font-size: 14px;
            }
            .content {
              padding: 30px;
            }
            .success-box {
              background: #d1fae5;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin-bottom: 25px;
              border-radius: 4px;
            }
            .success-box p {
              margin: 0;
              color: #065f46;
              font-weight: 500;
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .details-section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
            }
            .detail-row {
              display: flex;
              padding: 12px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #6b7280;
              width: 140px;
              flex-shrink: 0;
            }
            .detail-value {
              color: #1f2937;
              flex: 1;
            }
            .platforms-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 5px;
            }
            .platform-tag {
              background: #dbeafe;
              color: #1e40af;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 13px;
              font-weight: 500;
            }
            .info-box {
              background: #f0f9ff;
              border: 1px solid #bae6fd;
              padding: 15px;
              border-radius: 6px;
              margin-top: 20px;
            }
            .info-box h3 {
              margin: 0 0 10px;
              color: #0c4a6e;
              font-size: 16px;
            }
            .info-box p {
              margin: 5px 0;
              color: #075985;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin-top: 20px;
              text-align: center;
            }
            .footer {
              background: #f9fafb;
              padding: 20px 30px;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1> Request Confirmed</h1>
              <p>Your design request has been successfully submitted</p>
            </div>
            
            <div class="content">
              <div class="success-box">
                <p>✨ Your request has been received and is now being reviewed by our team!</p>
              </div>

              <p class="greeting">Hi <strong>${agentName}</strong>,</p>
              <p>Thank you for submitting your design request. We've received all the details and our team will start working on it soon.</p>

              <div class="details-section">
                <div class="section-title"> Request Summary</div>
                <div class="detail-row">
                  <span class="detail-label">Request ID:</span>
                  <span class="detail-value"><strong>${requestId}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Project Title:</span>
                  <span class="detail-value">${requestTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Template:</span>
                  <span class="detail-value">${templateTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Category:</span>
                  <span class="detail-value">${templateCategory}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Deadline:</span>
                  <span class="detail-value"> ${deadline}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Submitted:</span>
                  <span class="detail-value">${submittedAt}</span>
                </div>
              </div>

              <div class="details-section">
                <div class="section-title"> Platforms</div>
                <div class="platforms-list">
                  ${platforms.map(platform => `<span class="platform-tag">${platform}</span>`).join('')}
                </div>
              </div>

              <div class="info-box">
                <h3>What happens next?</h3>
                <p>• You'll receive updates via email as your project progresses</p>
                <p>• You can track the status in your dashboard anytime</p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.AGENT_DASHBOARD_URL || '#'}/my-requests/${requestId}" class="button">
                  View My Request →
                </a>
              </div>
            </div>

            <div class="footer">
              <p><strong>Mar Lease BE</strong> - Design Management System</p>
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Send email using your email service
  await sendEmail({
    to: toEmail,
    subject,
    html: htmlContent,
  });
}

// 2) Request completed → notify Agent + Admin
export async function sendRequestCompletedNotificationEmail({
  agentEmail,
  agentName,
  requestTitle,
}) {
  const subject = "Your Marketing Request Has Been Completed";

  const textForAgent =
    `Dear ${agentName},\n\n` +
    `Your request "${requestTitle}" has been completed.\n` +
    `You can download or review it by logging into your dashboard.\n\n` +
    `Thank you.`;

  const htmlForAgent = baseEmailTemplate({
    title: "Your Marketing Request Has Been Completed",
    messageLines: [
      `Dear <strong>${agentName}</strong>,`,
      `Your marketing request titled <strong>"${requestTitle}"</strong> has been completed.`,
      "You can download or review the final files by logging into your dashboard.",
    ],
    buttonLabel: "View Your Request",
    buttonHref: `${ENV.BASE_URL || ""}/dashboard/agent/requests`,
  });

  const textForAdmin =
    `The marketing request "${requestTitle}" has been marked as completed.\n\n` +
    `You can review it in the admin dashboard.`;

  const htmlForAdmin = baseEmailTemplate({
    title: "Marketing Request Completed",
    messageLines: [
      `The marketing request titled <strong>"${requestTitle}"</strong> has been marked as completed.`,
      "You can review the final files and status in the admin dashboard.",
    ],
    buttonLabel: "Open Admin Dashboard",
    buttonHref: `${ENV.BASE_URL || ""}/dashboard/admin/requests`,
  });

  const tasks = [];

  if (agentEmail) {
    tasks.push(
      sendEmail({
        to: agentEmail,
        subject,
        text: textForAgent,
        html: htmlForAgent,
      })
    );
  }

  if (ADMIN_EMAIL) {
    tasks.push(
      sendEmail({
        to: ADMIN_EMAIL,
        subject,
        text: textForAdmin,
        html: htmlForAdmin,
      })
    );
  } else {
    console.warn("ADMIN_EMAIL not set – skipping admin completion email.");
  }

  await Promise.all(tasks);
}


// NEW: Welcome email for new user registration
export async function sendWelcomeEmail({ userEmail, userName, role }) {
  if (!userEmail) {
    console.warn("User email not provided – skipping welcome email.");
    return;
  }

  const subject = "Welcome to One West Group Marketing Platform";

  const dashboardUrl = "https://www.owghub.com/"

  const text =
    `Dear ${userName},\n\n` +
    `Welcome to the One West Group Marketing Requests Platform!\n\n` +
    `Your account has been successfully created. You can now log in and start managing your marketing requests.\n\n` +
    `Thank you for joining us!`;

  const html = baseEmailTemplate({
    title: "Welcome to One West Group!",
    messageLines: [
      `Dear <strong>${userName}</strong>,`,
      "Welcome to the <strong>One West Group Marketing Requests Platform</strong>!",
      "Your account has been successfully created. You can now log in and start managing your marketing requests.",
      "We're excited to have you on board and look forward to supporting your marketing needs.",
    ],
    buttonLabel: "Go to Dashboard",
    buttonHref: dashboardUrl,
  });

  try {
    await sendEmail({
      to: userEmail,
      subject,
      text,
      html,
    });
    console.log(`Welcome email sent to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${userEmail}:`, error);
    // Don't throw - we don't want email failures to break registration
  }
}

// 3) Password reset email → send reset link to user
export async function sendPasswordResetEmail({ userEmail, userName, resetToken }) {
  if (!userEmail) {
    console.warn("User email not provided – skipping password reset email.");
    return;
  }

  const resetUrl = `https://www.owghub.com/auth/newpassword?token=${resetToken}`;
  const subject = "Reset Your Password - One West Group";

  const text =
    `Dear ${userName},\n\n` +
    `We received a request to reset your password for your One West Group account.\n\n` +
    `Click the link below to reset your password (valid for 30 minutes):\n` +
    `${resetUrl}\n\n` +
    `If you didn't request this, please ignore this email.\n\n` +
    `Thank you.`;

  const html = baseEmailTemplate({
    title: "Password Reset Request",
    messageLines: [
      `Dear <strong>${userName}</strong>,`,
      "We received a request to reset your password for your One West Group account.",
      "Click the button below to reset your password. This link is valid for <strong>30 minutes</strong>.",
      "If you didn't request a password reset, please ignore this email and your password will remain unchanged.",
    ],
    buttonLabel: "Reset Password",
    buttonHref: resetUrl,
  });

  try {
    await sendEmail({
      to: userEmail,
      subject,
      text,
      html,
    });
    console.log(`Password reset email sent to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send password reset email to ${userEmail}:`, error);
    throw error; // Re-throw so caller knows it failed
  }
}

