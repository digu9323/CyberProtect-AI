
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLogo from "../components/AuthLogo";

export default function Dashboard() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const navigate = useNavigate();

  function scan() {
    if (!input.trim()) {
      return setResult("Please enter a URL, email, or SMS.");
    }

    setResult(
      "Scan submitted successfully. Backend analysis will be added next."
    );
  }

  function logout() {
    // Clear authentication from both storage types.
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("loggedInUser");

    // Keep the remembered email if Remember Me was selected.
    // Otherwise, clear saved email preferences.
    if (localStorage.getItem("rememberMe") !== "true") {
      localStorage.removeItem("rememberEmail");
      localStorage.removeItem("rememberMe");
    }

    navigate("/", { replace: true });
  }

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <AuthLogo />

        <nav>
          {[
            ["fa-house", "Dashboard"],
            ["fa-globe", "Phishing Detection"],
            ["fa-envelope", "Email Spam"],
            ["fa-virus", "Malware Scanner"],
            ["fa-mobile-screen", "Fraud SMS"],
            ["fa-chart-line", "Reports"],
          ].map(([i, t]) => (
            <button key={t} type="button">
              <i className={`fa-solid ${i}`} />
              {t}
            </button>
          ))}
        </nav>
      </aside>

      <section className="dashboard-main">
        <header>
          <div>
            <p className="eyebrow">SECURITY OVERVIEW</p>
            <h1>Welcome to CyberProtect AI</h1>
          </div>

          <button className="logout" onClick={logout} type="button">
            Logout
          </button>
        </header>

        <div className="stats">
          {[
            ["245", "Total Scans"],
            ["34", "Threats Detected"],
            ["211", "Safe Files"],
            ["98%", "Accuracy"],
          ].map(([n, l]) => (
            <article key={l}>
              <strong>{n}</strong>
              <span>{l}</span>
            </article>
          ))}
        </div>

        <section className="scan-box">
          <h2>Quick Threat Scan</h2>

          <p>Paste a website URL, email content, or SMS text.</p>

          <div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter URL / Email / SMS"
            />

            <button className="primary-btn" onClick={scan} type="button">
              Scan now
            </button>
          </div>

          {result && <p className="scan-result">{result}</p>}
        </section>
      </section>
    </main>
  );
}
