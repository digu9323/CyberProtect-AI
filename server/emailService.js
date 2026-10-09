const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"CyberProtect AI" digu9323@gmail.com`,
    to: email,
    subject: "CyberProtect AI - Verify Your Email",

    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>CyberProtect AI - Email Verification</title>
      </head>

      <body style="
        margin:0;
        padding:0;
        background-color:#0b1020;
        font-family:Arial, Helvetica, sans-serif;
      ">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="background-color:#0b1020; padding:40px 15px;"
        >

          <tr>
            <td align="center">

              <!-- Main Card -->
              <table
                width="600"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width:600px;
                  width:100%;
                  background-color:#111827;
                  border-radius:16px;
                  overflow:hidden;
                  border:1px solid #263248;
                "
              >

                <!-- Header -->
                <tr>
                  <td
                    align="center"
                    style="
                      padding:32px 20px;
                      background:linear-gradient(135deg,#6d28d9,#2563eb);
                    "
                  >

                    <div style="
                      font-size:28px;
                      font-weight:bold;
                      color:#ffffff;
                      letter-spacing:0.5px;
                    ">
                      🛡 CyberProtect AI
                    </div>

                    <div style="
                      margin-top:8px;
                      font-size:14px;
                      color:#e5e7eb;
                    ">
                      AI-Powered Cybersecurity Protection
                    </div>

                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td
                    style="
                      padding:40px 35px;
                      color:#e5e7eb;
                    "
                  >

                    <h1 style="
                      margin:0 0 15px 0;
                      font-size:28px;
                      color:#ffffff;
                      text-align:center;
                    ">
                      Verify Your Email
                    </h1>

                    <p style="
                      margin:0 0 25px 0;
                      font-size:16px;
                      line-height:1.7;
                      color:#cbd5e1;
                      text-align:center;
                    ">
                      Welcome to <strong style="color:#ffffff;">
                      CyberProtect AI
                      </strong>.
                      Use the verification code below to complete
                      your account registration.
                    </p>

                    <!-- OTP Box -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td align="center">

                          <div style="
                            display:inline-block;
                            padding:18px 35px;
                            background-color:#1e293b;
                            border:2px solid #7c3aed;
                            border-radius:12px;
                            color:#ffffff;
                            font-size:34px;
                            font-weight:bold;
                            letter-spacing:8px;
                          ">
                            ${otp}
                          </div>

                        </td>
                      </tr>
                    </table>

                    <p style="
                      margin:25px 0 0 0;
                      text-align:center;
                      font-size:14px;
                      color:#94a3b8;
                    ">
                      This verification code will expire in
                      <strong style="color:#a78bfa;">
                        5 minutes
                      </strong>.
                    </p>

                    <!-- Security Notice -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="
                        margin-top:30px;
                        background-color:#172033;
                        border-radius:10px;
                      "
                    >
                      <tr>
                        <td style="padding:18px 20px;">

                          <p style="
                            margin:0;
                            font-size:13px;
                            line-height:1.6;
                            color:#94a3b8;
                          ">
                            🔒 <strong style="color:#e2e8f0;">
                            Security Notice:
                            </strong>
                            Never share this verification code with anyone.
                            CyberProtect AI will never ask you for your OTP.
                          </p>

                        </td>
                      </tr>
                    </table>

                    <p style="
                      margin:30px 0 0 0;
                      font-size:13px;
                      line-height:1.6;
                      color:#64748b;
                      text-align:center;
                    ">
                      If you did not request this verification code,
                      you can safely ignore this email.
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td
                    align="center"
                    style="
                      padding:25px 20px;
                      background-color:#0f172a;
                      border-top:1px solid #263248;
                    "
                  >

                    <p style="
                      margin:0;
                      font-size:13px;
                      color:#64748b;
                    ">
                      © 2026 CyberProtect AI
                    </p>

                    <p style="
                      margin:8px 0 0 0;
                      font-size:12px;
                      color:#475569;
                    ">
                      AI-Powered Cybersecurity Protection
                    </p>

                  </td>
                </tr>

              </table>

            </td>
          </tr>

        </table>

      </body>
      </html>
    `,
  });
};

module.exports = {
  sendOTPEmail,
};