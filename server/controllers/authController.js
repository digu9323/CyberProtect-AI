
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

const createJwt = (user) =>
  jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message:
          "An account with this email already exists. Please sign in.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
         (name, email, password, auth_provider)
       VALUES ($1, $2, $3, 'local')
       RETURNING id, name, email, created_at, auth_provider`,
      [name.trim(), normalizedEmail, hashedPassword]
    );

    return res.status(201).json({
      message: "Registration successful.",
      user: publicUser(result.rows[0]),
    });
  } catch (error) {
    console.error("Registration Error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      message: "Registration failed.",
    });
  }
};

// EMAIL AND PASSWORD LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1",
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    if (user.auth_provider === "google") {
      return res.status(403).json({
        message:
          "This account uses Google sign-in. Please continue with Google.",
        googleAccount: true,
      });
    }

    // Never treat the Google placeholder as a real password.
    if (user.password === "GOOGLE_LOGIN") {
      return res.status(403).json({
        message:
          "This account uses Google sign-in. Please continue with Google.",
        googleAccount: true,
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    return res.status(200).json({
      message: "Login successful.",
      token: createJwt(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    return res.status(500).json({
      message: "Login failed.",
    });
  }
};

// GOOGLE LOGIN
const googleLogin = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        message: "Google authorization code is required.",
      });
    }

    const { tokens } = await googleClient.getToken(code);

    if (!tokens.id_token) {
      return res.status(401).json({
        message: "Google did not return an identity token.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        message: "Google account identity could not be verified.",
      });
    }

    const email = payload.email.trim().toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || email.split("@")[0];

    const client = await pool.connect();
    let user;

    try {
      await client.query("BEGIN");

      const existing = await client.query(
        `SELECT *
         FROM users
         WHERE LOWER(email) = $1
         LIMIT 1
         FOR UPDATE`,
        [email]
      );

      if (existing.rows.length > 0) {
        user = existing.rows[0];

        // If this account is already linked, ensure it is the same
        // verified Google identity.
        if (
          user.google_id &&
          user.google_id !== googleId
        ) {
          await client.query("ROLLBACK");

          return res.status(409).json({
            message:
              "A different Google identity is already linked to this account.",
          });
        }

        // Do not silently link Google to an existing password account.
        // Require an authenticated account-linking flow for that case.
        if (
          user.auth_provider === "local" &&
          user.password !== "GOOGLE_LOGIN"
        ) {
          await client.query("ROLLBACK");

          return res.status(409).json({
            message:
              "An account with this email already exists. Sign in with your password first, then link Google from account settings.",
            accountLinkRequired: true,
          });
        }

        await client.query(
          `UPDATE users
           SET auth_provider = 'google',
               google_id = $1
           WHERE id = $2`,
          [googleId, user.id]
        );

        user.auth_provider = "google";
        user.google_id = googleId;
      } else {
        const result = await client.query(
          `INSERT INTO users
             (name, email, password, auth_provider, google_id)
           VALUES ($1, $2, $3, 'google', $4)
           RETURNING id, name, email, auth_provider, google_id`,
          [name, email, "GOOGLE_LOGIN", googleId]
        );

        user = result.rows[0];
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return res.status(200).json({
      message: "Google login successful.",
      token: createJwt(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Google Login Error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This Google account is already linked to another account.",
      });
    }

    return res.status(500).json({
      message: "Google login failed.",
    });
  }
};

// CONSUME ONE-TIME RECOVERY TOKEN
const consumeRecoveryToken = async (token) => {
  if (!token) {
    return null;
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const result = await pool.query(
    `DELETE FROM password_recovery_tokens
     WHERE token_hash = $1
       AND purpose = 'recovery'
       AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash]
  );

  return result.rows[0] || null;
};

// LOGIN DIRECTLY AFTER OTP VERIFICATION
const recoveryLogin = async (req, res) => {
  try {
    const { recoveryToken } = req.body;
    const authorization = await consumeRecoveryToken(recoveryToken);

    if (!authorization) {
      return res.status(401).json({
        message:
          "Recovery authorization is invalid or expired. Please verify your OTP again.",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE id = $1`,
      [authorization.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Account not found.",
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      message: "Login successful.",
      token: createJwt(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Recovery Login Error:", error.message);

    return res.status(500).json({
      message: "Unable to log in.",
    });
  }
};

// RESET PASSWORD AFTER OTP VERIFICATION
const resetPassword = async (req, res) => {
  try {
    const { recoveryToken, password } = req.body;

    if (!recoveryToken || !password) {
      return res.status(400).json({
        message:
          "Recovery authorization and new password are required.",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const authorization = await consumeRecoveryToken(recoveryToken);

    if (!authorization) {
      return res.status(401).json({
        message:
          "Recovery authorization is invalid or expired. Please verify your OTP again.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `UPDATE users
       SET password = $1,
           auth_provider = CASE
             WHEN auth_provider = 'google' THEN 'both'
             ELSE auth_provider
           END
       WHERE id = $2
       RETURNING id`,
      [hashedPassword, authorization.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Account not found.",
      });
    }

    return res.status(200).json({
      message: "Password updated successfully. Please sign in.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error.message);

    return res.status(500).json({
      message: "Password update failed.",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  recoveryLogin,
  resetPassword,
};
