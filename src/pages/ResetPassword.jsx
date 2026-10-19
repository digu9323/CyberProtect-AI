
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLogo from "../components/AuthLogo";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const recoveryToken = location.state?.recoveryToken;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recoveryToken) {
      alert("Your password reset session is missing or expired. Please request a new OTP.");
      navigate("/forgot-password");
      return;
    }

    if (password.length < 8) {
      alert("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recoveryToken, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to update password.");
        return;
      }

      alert("Password updated successfully. Please sign in.");
      navigate("/");
    } catch (error) {
      console.error("Password reset error:", error);
      alert("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <AuthLogo />

      <section className="auth-card">
        <div className="auth-header">
          <i className="fa-solid fa-lock" />
          <h1>Update Password</h1>
          <p>Create a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <i className="fa-solid fa-lock" />
            <input
              type="password"
              placeholder="New password (minimum 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </label>

          <label className="field">
            <i className="fa-solid fa-lock" />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          <button
            className="primary-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
            {!loading && <i className="fa-solid fa-arrow-right" />}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}
