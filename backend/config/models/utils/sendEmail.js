const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, code) => {
  await transporter.sendMail({
    from: `"Your E-Commerce Store" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your E-Commerce Account",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 30px;
        border: 1px solid #ddd;
        border-radius: 10px;
      ">

        <h2>Verify Your Email</h2>

        <p>
          Thank you for creating an account with our store.
        </p>

        <p>
          Your verification code is:
        </p>

        <h1 style="
          letter-spacing: 8px;
          text-align: center;
        ">
          ${code}
        </h1>

        <p>
          This code will expire in 10 minutes.
        </p>

        <p>
          If you did not create this account, you can ignore this email.
        </p>

      </div>
    `,
  });
};

module.exports = sendVerificationEmail;