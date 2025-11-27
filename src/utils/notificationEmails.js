// src/utils/notificationEmails.js
import { ENV } from "../config/env.js";
import { sendEmail } from "./sendEmail.js";

const ADMIN_EMAIL = "admin@account.com";

// Simple base HTML template with Saad's branding in the footer
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

// 1) New marketing request submitted → notify Admin/VA
export async function sendNewRequestNotificationEmail({ agentName, requestTitle }) {
  if (!ADMIN_EMAIL) {
    console.warn("ADMIN_EMAIL not set – skipping new request notification email.");
    return;
  }

  const subject = "New Marketing Request Received";

  const text =
    `A new marketing request has been submitted by ${agentName}.\n\n` +
    `Request Title: ${requestTitle}\n\n` +
    `Please review it on the dashboard.`;

  const html = baseEmailTemplate({
    title: "New Marketing Request Received",
    messageLines: [
      `A new marketing request has been submitted by <strong>${agentName}</strong>.`,
      `Request Title: <strong>${requestTitle}</strong>.`,
      "Please review and assign this request in your dashboard.",
    ],
    buttonLabel: "Open Admin Dashboard",
    buttonHref: `${ENV.BASE_URL || ""}/dashboard/admin/requests`,
  });

  await sendEmail({
    to: ADMIN_EMAIL,
    subject,
    text,
    html,
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
