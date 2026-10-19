
import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLogo from "../components/AuthLogo";

export default function OTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);

  const email =
    location.state?.email ||
    localStorage.getItem("resetEmail") ||
    "";

  const purpose = location.state?.purpose || "password-reset";

  const [otp, setOtp] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const digits = otp.split("");
    digits[index] = digit;

    const nextOtp = digits.join("").slice(0, 6);
    setOtp(nextOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const digits = otp.split("");
        digits[index] = "";
        setOtp(digits.join(""));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();

    const pastedOtp = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedOtp) return;

    setOtp(pastedOtp);

    const nextIndex = Math.min(pastedOtp.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      alert("Please enter all 6 digits of the OTP.");
      return;
    }

    if (!email) {
      alert("Please enter your email again.");
      navigate("/forgot-password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp, purpose }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "OTP verification failed.");
        return;
      }

      if (purpose === "password-reset") {
        if (!data.recoveryToken) {
          alert("Recovery token was not returned by the server.");
          return;
        }

        setRecoveryToken(data.recoveryToken);
      }

      setVerified(true);
    } catch (error) {
      console.error("OTP verification error:", error);
      alert("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = async () => {
    if (!recoveryToken) {
      alert("Please verify your OTP first.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/recovery-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recoveryToken }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Direct login failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("loggedInUser", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (error) {
      console.error("Recovery login error:", error);
      alert("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = () => {
    if (!recoveryToken) {
      alert("Please verify your OTP first.");
      return;
    }

    navigate("/reset-password", {
      state: { email, recoveryToken },
    });
  };

  return (
    <main className="auth-page">
      <AuthLogo />

      <section className="auth-card">
        <div className="auth-header">
          <i className="fa-solid fa-shield-halved" />

          <h1>{verified ? "OTP Verified" : "Verify OTP"}</h1>

          <p>
            {verified
              ? "Choose how you want to continue."
              : `Enter the 6-digit OTP sent to ${email}.`}
          </p>
        </div>

        {!verified ? (
          <form onSubmit={handleVerify}>
            <div className="otp-inputs">
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  className="otp-box"
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`OTP digit ${index + 1}`}
                  value={otp[index] || ""}
                  onChange={(e) =>
                    handleOtpChange(index, e.target.value)
                  }
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  required
                />
              ))}
            </div>

            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
              {!loading && <i className="fa-solid fa-arrow-right" />}
            </button>
          </form>
        ) : purpose === "password-reset" ? (
          <div className="auth-actions">
            <button
              className="primary-btn"
              type="button"
              onClick={handleDirectLogin}
              disabled={loading}
            >
              {loading ? "Please wait..." : "Login Directly"}
            </button>

            <button
              className="primary-btn"
              type="button"
              onClick={handleUpdatePassword}
              disabled={loading}
            >
              Update Password
            </button>
          </div>
        ) : (
          <p className="auth-switch">OTP verified successfully.</p>
        )}

        <p className="auth-switch">
          <Link to="/forgot-password">Back</Link>
          {" · "}
          <Link to="/">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
