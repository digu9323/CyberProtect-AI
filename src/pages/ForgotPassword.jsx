
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLogo from "../components/AuthLogo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleAccount, setGoogleAccount] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();

    setError("");
    setGoogleAccount(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            purpose: "password-reset",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.googleAccount) {
          setGoogleAccount(true);
        }

        setError(data.message || "Unable to send OTP.");
        return;
      }

      localStorage.setItem("resetEmail", normalizedEmail);

      navigate("/otp", {
        state: {
          email: normalizedEmail,
          purpose: "password-reset",
        },
      });
    } catch (error) {
      console.error("Forgot Password Error:", error);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <AuthLogo />

      <section className="auth-card">
        <div className="auth-header">
          <i className="fa-solid fa-key" />

          <h1>Forgot password?</h1>

          <p>Enter your registered email to continue.</p>
        </div>

        <form onSubmit={submit}>
          <label className="field">
            <i className="fa-solid fa-envelope" />

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setGoogleAccount(false);
              }}
              autoComplete="email"
              required
              disabled={loading}
            />
          </label>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: "12px",
                padding: "12px",
                borderRadius: "10px",
                background: "rgba(255, 90, 90, 0.10)",
                border: "1px solid rgba(255, 90, 90, 0.35)",
                color: "#ffaaaa",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              <i className="fa-solid fa-circle-exclamation" />{" "}
              {error}
            </div>
          )}

          {googleAccount && (
            <button
              type="button"
              className="primary-btn"
              style={{ marginTop: "12px" }}
              onClick={() => navigate("/")}
            >
              <i className="fa-brands fa-google" />
              Continue to Sign in with Google
            </button>
          )}

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
            style={{ marginTop: "16px" }}
          >
            {loading ? "Sending OTP..." : "Continue"}
            {!loading && (
              <i className="fa-solid fa-arrow-right" />
            )}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}
