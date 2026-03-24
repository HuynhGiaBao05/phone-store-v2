const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Phone Store" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: html, // ✅ giờ đúng
    });

    console.log("✅ Email sent successfully");
  } catch (error) {
    console.log("❌ Email error:", error);
  }
};

module.exports = sendEmail;