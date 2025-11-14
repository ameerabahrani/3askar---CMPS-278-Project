// backend/utils/sendEmail.js
const nodemailer = require("nodemailer");

async function sendEmail({ to, subject, html, text }) {
  // 1) Create the transporter (Gmail SMTP)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { //logs in to the email account
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2) Define the email content
  const mailOptions = {
    from: `"3askar Drive" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  // 3) Actually send the email
  const info = await transporter.sendMail(mailOptions);
  console.log("📧 Email sent:", info.messageId);
}

module.exports = sendEmail;
