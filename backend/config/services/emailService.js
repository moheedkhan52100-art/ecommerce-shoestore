const nodemailer = require("nodemailer");

const getGmailConfig = () => ({
  user: String(process.env.EMAIL_USER || "").trim(),
  // Gmail app passwords are displayed in groups of four characters.
  // Remove spaces in case that display format was copied into .env.
  pass: String(process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || "")
    .replace(/\s/g, "")
});

const sendOrderStatusEmail = async (order, previousStatus) => {
  const { user, pass } = getGmailConfig();
  if (!user || !pass || !order?.email) {
    console.warn("Order status email not sent because recipient or Gmail credentials are missing.");
    return { info: null, skipped: true };
  }

  const orderNumber = String(order._id).slice(-6).toUpperCase();
  const customerName = String(order.shipping?.name || "Customer");
  const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });
    const info = await transporter.sendMail({
      from: `"Khan Store" <${user}>`,
      to: order.email,
      subject: `Order #${orderNumber} status update`,
      text: `Hello ${customerName}, your order #${orderNumber} status changed from ${previousStatus || "Unknown"} to ${order.status}.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #211b14;">
          <h2>Order status update</h2>
          <p>Hello ${escapeHtml(customerName)},</p>
          <p>The status of your order <strong>#${orderNumber}</strong> has changed.</p>
          <p>Previous status: ${escapeHtml(String(previousStatus || "Unknown"))}</p>
          <p>Current status: <strong>${escapeHtml(String(order.status))}</strong></p>
          <p>Thank you for shopping with Khan Store.</p>
        </div>
      `
    });
    console.log(`[ORDER STATUS] Email sent successfully to ${order.email}`);
    return { info, skipped: false };
  } catch (error) {
    console.warn(`[ORDER STATUS] Failed to email ${order.email}: ${error.message}`);
    return { info: null, skipped: true, error: error.message };
  }
};

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
  sendOtpEmail,
  sendOrderStatusEmail
};
