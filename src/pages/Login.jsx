import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLogo from "../components/AuthLogo";
import { GoogleLogin } from "@react-oauth/google";
import { useGoogleLogin } from "@react-oauth/google";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load remembered email
  useEffect(() => {
    if (localStorage.getItem("rememberMe") === "true") {
      setEmail(localStorage.getItem("rememberEmail") || "");
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password
          })
        }
      );

      const data = await response.json();

      if (response.ok) {

        // Save JWT Token
        localStorage.setItem("token", data.token);

        // Save logged-in user information
        localStorage.setItem(
          "loggedInUser",
          JSON.stringify(data.user)
        );

        // Remember email if checkbox selected
        if (rememberMe) {
          localStorage.setItem("rememberEmail", email);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberEmail");
          localStorage.removeItem("rememberMe");
        }

        alert("Login successful!");

        navigate("/dashboard");

      } else {
        alert(data.message);
      }

    } catch (error) {

      console.error("Login Error:", error);

      alert("Cannot connect to server.");
    }
  };

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
        alert(data.message || "Google login failed");
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save logged-in user
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify(data.user)
      );

      // Go to Dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Unable to connect to server");
    }
  },

  onError: () => {
    console.log("Google Login Failed");
    alert("Google Login Failed");
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


        {/* LOGIN FORM */}

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}

          <label className="field">

            <i className="fa-solid fa-envelope" />

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </label>


          {/* PASSWORD */}

          <label className="field">

            <i className="fa-solid fa-lock" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password"
            >

              <i
                className={`fa-solid ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                }`}
              />

            </button>

          </label>


          {/* REMEMBER ME */}

          <div className="form-row">

            <label>

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              Remember me

            </label>


            <Link to="/forgot-password">
              Forgot password?
            </Link>

          </div>


          {/* LOGIN BUTTON */}

          <button
            className="primary-btn"
            type="submit"
          >

            Sign in

            <i className="fa-solid fa-arrow-right" />

          </button>

        </form>


        {/* OR DIVIDER */}

        <div className="divider">

          <span>OR</span>

        </div>


        {/* GOOGLE LOGIN */}

     <button
            type="button"
  className="social-btn"
  onClick={() => googleLogin()}
>
  <i className="fa-brands fa-google"></i>

  <span>Continue with Google</span>
</button>


        {/* MICROSOFT LOGIN 

        <button
          type="button"
          className="social-btn"
        >

          <i className="fa-brands fa-microsoft"></i>

          <span>Continue with Microsoft</span>

        </button>  */}


        {/* SIGNUP LINK */}

        <p className="auth-switch">

          New to CyberProtect AI?

          <Link to="/signup">
            Create account
          </Link>

        </p>

      </section>

    </main>
  );
}