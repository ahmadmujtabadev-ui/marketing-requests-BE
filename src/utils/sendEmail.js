import nodemailer from 'nodemailer';
import { ENV } from "../config/env.js";

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: ENV.MAIL_USER,
    pass: ENV.MAIL_PASS,
  },
});

export async function sendEmail({ to, subject, html }) {
  const mailOptions = {
    from: `One West Group <${ENV.MAIL_USER}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
}
