
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLogo from "../components/AuthLogo";
import { useGoogleLogin } from "@react-oauth/google";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load remembered email when the page opens.
  useEffect(() => {
    const savedRememberMe =
      localStorage.getItem("rememberMe") === "true";

    if (savedRememberMe) {
      setEmail(localStorage.getItem("rememberEmail") || "");
      setRememberMe(true);
    }
  }, []);

  // Save authentication according to Remember Me selection.
  const saveLogin = (data, remember) => {
    // Clear old session data to avoid conflicting login states.
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("loggedInUser");

    const storage = remember ? localStorage : sessionStorage;

    storage.setItem("token", data.token);
    storage.setItem("loggedInUser", JSON.stringify(data.user));

    if (remember) {
      localStorage.setItem("rememberEmail", email.trim().toLowerCase());
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("rememberEmail");
      localStorage.removeItem("rememberMe");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed.");
        return;
      }

      saveLogin(data, rememberMe);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login Error:", error);
      alert("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",

    onSuccess: async (response) => {
      try {
        setLoading(true);

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
          alert(data.message || "Google login failed.");
          return;
        }

        // Google login uses the same Remember Me selection.
        saveLogin(data, rememberMe);
        navigate("/dashboard");
      } catch (error) {
        console.error("Google Login Error:", error);
        alert("Unable to connect to server.");
      } finally {
        setLoading(false);
      }
    },

    onError: () => {
      alert("Google login failed.");
    },
  });

  return (
    <main className="auth-page">
      <AuthLogo />

      <section className="auth-card">
        <div className="auth-header">
          <i className="fa-solid fa-user-shield" />
          <h1>Welcome back</h1>
          <p>Sign in to continue to CyberProtect AI</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <i className="fa-solid fa-envelope" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </label>

          <label className="field">
            <i className="fa-solid fa-lock" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i
                className={`fa-solid ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                }`}
              />
            </button>
          </label>

          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              Remember me
            </label>

            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button
            className="primary-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <i className="fa-solid fa-arrow-right" />}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="social-btn"
          onClick={() => googleLogin()}
          disabled={loading}
        >
          <i className="fa-brands fa-google" />
          <span>
            {loading ? "Please wait..." : "Continue with Google"}
          </span>
        </button>

        <p className="auth-switch">
          New to CyberProtect AI? <Link to="/signup">Create account</Link>
        </p>
      </section>
    </main>
  );
}
