
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../config/db");
const { sendOTPEmail } = require("../emailService");

// Send OTP for registration or password recovery.
const sendOTP = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const purpose = req.body.purpose || "registration";

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!["registration", "password-reset"].includes(purpose)) {
      return res.status(400).json({ message: "Invalid OTP purpose." });
    }

    const userResult = await pool.query(
      `SELECT id, auth_provider
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email]
    );

    if (purpose === "registration" && userResult.rows.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    if (purpose === "password-reset") {
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          message: "No account found with this email.",
        });
      }

      if (userResult.rows[0].auth_provider === "google") {
        return res.status(403).json({
          message:
            "This account uses Google sign-in. Please continue with Google to access your account.",
          googleAccount: true,
        });
      }
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `DELETE FROM email_otps
       WHERE LOWER(email) = $1 AND purpose = $2`,
      [email, purpose]
    );

    await pool.query(
      `INSERT INTO email_otps
       (email, otp_hash, expires_at, attempts, purpose)
       VALUES ($1, $2, $3, 0, $4)`,
      [email, otpHash, expiresAt, purpose]
    );

    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      await pool.query(
        `DELETE FROM email_otps
         WHERE LOWER(email) = $1 AND purpose = $2`,
        [email, purpose]
      );
      throw emailError;
    }

    return res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({ message: "Failed to send OTP." });
  }
};

// Verify OTP and create a recovery token when appropriate.
const verifyOTP = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { otp } = req.body;
    const purpose = req.body.purpose || "registration";

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required.",
      });
    }

    if (!["registration", "password-reset"].includes(purpose)) {
      return res.status(400).json({ message: "Invalid OTP purpose." });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        message: "Enter a valid 6-digit OTP.",
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM email_otps
       WHERE LOWER(email) = $1 AND purpose = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, purpose]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "OTP not found. Please request a new OTP.",
      });
    }

    const record = result.rows[0];

    if (new Date() >= new Date(record.expires_at)) {
      await pool.query("DELETE FROM email_otps WHERE id = $1", [record.id]);
      return res.status(400).json({
        message: "OTP expired. Please request a new OTP.",
      });
    }

    if (record.attempts >= 5) {
      await pool.query("DELETE FROM email_otps WHERE id = $1", [record.id]);
      return res.status(429).json({
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    const isValid = await bcrypt.compare(String(otp), record.otp_hash);

    if (!isValid) {
      await pool.query(
        `UPDATE email_otps
         SET attempts = attempts + 1
         WHERE id = $1`,
        [record.id]
      );
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (purpose === "registration") {
      await pool.query("DELETE FROM email_otps WHERE id = $1", [record.id]);

      return res.status(200).json({
        message: "OTP verified successfully.",
        verified: true,
        purpose: "registration",
      });
    }

    // Recheck the account's authentication provider.
    const userResult = await pool.query(
      `SELECT id, auth_provider
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      await pool.query("DELETE FROM email_otps WHERE id = $1", [record.id]);
      return res.status(404).json({ message: "Account not found." });
    }

    const user = userResult.rows[0];

    if (user.auth_provider === "google") {
      await pool.query("DELETE FROM email_otps WHERE id = $1", [record.id]);

      return res.status(403).json({
        message:
          "This account uses Google sign-in. Please continue with Google to access your account.",
        googleAccount: true,
      });
    }

    const recoveryToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(recoveryToken)
      .digest("hex");

    const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "DELETE FROM email_otps WHERE id = $1",
        [record.id]
      );

      await client.query(
        `DELETE FROM password_recovery_tokens
         WHERE user_id = $1 AND purpose = 'recovery'`,
        [user.id]
      );

      await client.query(
        `INSERT INTO password_recovery_tokens
         (user_id, token_hash, purpose, expires_at)
         VALUES ($1, $2, 'recovery', $3)`,
        [user.id, tokenHash, tokenExpiresAt]
      );

      await client.query("COMMIT");
    } catch (transactionError) {
      await client.query("ROLLBACK");
      throw transactionError;
    } finally {
      client.release();
    }

    return res.status(200).json({
      message: "OTP verified successfully.",
      verified: true,
      purpose: "password-reset",
      recoveryToken,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ message: "Failed to verify OTP." });
  }
};

module.exports = { sendOTP, verifyOTP };
