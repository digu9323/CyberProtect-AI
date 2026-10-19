import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLogo from "../components/AuthLogo";
import { useGoogleLogin } from "@react-oauth/google";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;

    const timer = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [otpTimer]);

  // Format timer as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (!formData.email) {
      alert("Please enter your email address.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to send OTP.");
        return;
      }

      setOtpSent(true);
      setOtpVerified(false);
      setFormData((prev) => ({
        ...prev,
        otp: "",
      }));

      // 5-minute countdown
      setOtpTimer(300);

      alert("OTP sent successfully. Check your email.");
    } catch (error) {
      console.error("Send OTP Error:", error);
      alert("Unable to connect to the server.");
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!formData.otp) {
      alert("Please enter the OTP.");
      return;
    }

    if (otpTimer <= 0) {
      alert("OTP has expired. Please request a new OTP.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            otp: formData.otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid OTP.");
        return;
      }

      setOtpVerified(true);
      setOtpTimer(0);

      alert("OTP verified successfully.");
    } catch (error) {
      console.error("Verify OTP Error:", error);
      alert("Unable to connect to the server.");
    }
  };

  // Normal registration
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!otpVerified) {
      alert("Please verify your email using OTP first.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Registration failed.");
        return;
      }

      alert("Registration successful!");
      navigate("/");
    } catch (error) {
      console.error("Registration Error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Google Login
  const googleLogin = useGoogleLogin({
    flow: "auth-code",

    onSuccess: async (response) => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/auth/google",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: response.code,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Google Login Failed.");
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "loggedInUser",
          JSON.stringify(data.user)
        );

        navigate("/dashboard");
      } catch (error) {
        console.error("Google Login Error:", error);
        alert("Google Login Failed.");
      }
    },

    onError: () => {
      alert("Google Login Failed.");
    },
  });

  return (
    <div className="auth-page">
      <div className="auth-card">

        <AuthLogo />

        <div className="auth-content">

          <h1>Create Account</h1>

          <p className="auth-subtitle">
            Create your CyberProtect AI account
          </p>

          <form onSubmit={handleSignup}>

            {/* First Name */}
            <div className="input-group">
              <label htmlFor="name">Name</label>

              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your first name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div className="input-group">
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                disabled={otpVerified}
                required
              />
            </div>

            {/* Send OTP */}
            {!otpSent && (
              <button
                type="button"
                className="auth-btn"
                onClick={handleSendOTP}
              >
                Send OTP
              </button>
            )}

            {/* OTP Section */}
            {otpSent && (
              <div className="otp-section">

                <div className="input-group">
                  <label htmlFor="otp">Enter OTP</label>

                  <input
                    id="otp"
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={handleChange}
                    maxLength={6}
                    inputMode="numeric"
                    disabled={otpVerified || otpTimer <= 0}
                  />
                </div>

                {!otpVerified && otpTimer > 0 && (
                  <button
                    type="button"
                    className="auth-btn"
                    onClick={handleVerifyOTP}
                  >
                    Verify OTP ({formatTime(otpTimer)})
                  </button>
                )}

                {!otpVerified && otpTimer <= 0 && (
                  <button
                    type="button"
                    className="auth-btn"
                    onClick={handleSendOTP}
                  >
                    Resend OTP
                  </button>
                )}

                {otpVerified && (
                  <div className="otp-success">
                    ✓ Email verified successfully
                  </div>
                )}

              </div>
            )}

            {/* Password */}
            <div className="input-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={!otpVerified}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={!otpVerified}
                required
              />
            </div>

            {/* Create Account */}
            <button
              type="submit"
              className="auth-btn"
              disabled={!otpVerified || loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* Google Login */}
          <button
            type="button"
            className="social-btn"
            onClick={() => googleLogin()}
          >
            <i className="fa-brands fa-google"></i>
            Continue with Google
          </button>

          {/* Login Link */}
          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/">Sign in</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Signup;