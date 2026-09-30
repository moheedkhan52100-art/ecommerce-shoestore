const nodemailer = require("nodemailer");

const getGmailConfig = () => ({
  user: String(process.env.EMAIL_USER || "").trim(),
  // Gmail app passwords are displayed in groups of four characters.
  // Remove spaces in case that display format was copied into .env.
  pass: String(process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || "")
    .replace(/\s/g, "")
});

const sendOtpEmail = async (email, otp) => {
  const { user, pass } = getGmailConfig();

  if (!user || !pass) {
    console.warn(`OTP email not sent because Gmail credentials are missing. OTP for ${email}: ${otp}`);
    return {
      info: null,
      skipped: true,
      otp
    };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  });

  const mailOptions = {
    from: `"Ecommerce Admin" <${user}>`,
    to: email,
    subject: "Your account verification code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #1f2937;">
        <h2 style="margin-bottom: 12px;">Email verification</h2>
        <p>Your OTP code is:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 20px 0; color: #111827;">${otp}</div>
        <p>This code is valid for 10 minutes.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[AUTH OTP] Verification email sent successfully to ${email}`);
    return {
      info,
      skipped: false,
      otp
    };
  } catch (error) {
    console.warn(`[AUTH OTP] Failed to send email to ${email}: ${error.message}`);
    console.warn(`[AUTH OTP] Fallback OTP for ${email}: ${otp}`);
    return {
      info: null,
      skipped: true,
      error: error.message,
      otp
    };
  }
};

module.exports = {
  sendOtpEmail
};
