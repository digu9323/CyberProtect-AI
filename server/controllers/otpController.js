const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { sendOTPEmail } = require("../emailService");

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before storing it
    const otpHash = await bcrypt.hash(otp, 10);

    // OTP expires after 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Remove previous OTPs for this email
    await pool.query(
      "DELETE FROM email_otps WHERE email = $1",
      [email]
    );

    // Store new OTP
    await pool.query(
      `INSERT INTO email_otps
       (email, otp_hash, expires_at, attempts)
       VALUES ($1, $2, $3, 0)`,
      [email, otpHash, expiresAt]
    );

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      message: "OTP sent successfully.",
    });

  } catch (error) {
    console.error("Send OTP Error:", error);

    res.status(500).json({
      message: "Failed to send OTP.",
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required.",
      });
    }

    const result = await pool.query(
      `SELECT * FROM email_otps
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "OTP not found. Please request a new OTP.",
      });
    }

    const otpRecord = result.rows[0];

    // Check expiry
    if (new Date() > new Date(otpRecord.expires_at)) {
      await pool.query(
        "DELETE FROM email_otps WHERE id = $1",
        [otpRecord.id]
      );

      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Check OTP
    const isValid = await bcrypt.compare(
      otp.toString(),
      otpRecord.otp_hash
    );

    if (!isValid) {
      await pool.query(
        `UPDATE email_otps
         SET attempts = attempts + 1
         WHERE id = $1`,
        [otpRecord.id]
      );

      return res.status(400).json({
        message: "Invalid OTP.",
      });
    }

    // OTP verified successfully
    await pool.query(
      "DELETE FROM email_otps WHERE id = $1",
      [otpRecord.id]
    );

    res.status(200).json({
      message: "OTP verified successfully.",
      verified: true,
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);

    res.status(500).json({
      message: "Failed to verify OTP.",
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
};