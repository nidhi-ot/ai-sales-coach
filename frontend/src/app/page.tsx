"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your email or phone number");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed");
        return;
      }

      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("rep_id", data.rep_id || data.user_id);
      localStorage.setItem("business_id", data.business_id);
      localStorage.setItem("full_name", data.full_name || "Sales Rep");
      localStorage.setItem("email", data.email || "");
      localStorage.setItem("phone_number", data.phone_number || "");
      localStorage.setItem("role", data.role || "rep");
      localStorage.setItem("remember_me", String(rememberMe));

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setError("Could not connect to backend");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f7faf8 0%, #eef7f2 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "1180px",
          minHeight: "680px",
          background: "#fff",
          borderRadius: "32px",
          overflow: "hidden",
          display: "flex",
          boxShadow: "0 28px 80px rgba(16,24,40,0.12)",
          border: "1px solid #e5e7eb",
        }}
      >
        <section
          style={{
            width: "460px",
            padding: "54px 50px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <img
            src="/logo.png"
            alt="AI Sales Coach"
            style={{
              width: "76px",
              height: "76px",
              objectFit: "contain",
              marginBottom: "26px",
            }}
          />

          <span style={badgeStyle}>AI Sales Coach</span>

          <h1
            style={{
              margin: "18px 0 8px",
              color: "#101828",
              fontSize: "34px",
              fontWeight: 900,
            }}
          >
            Welcome back!
          </h1>

          <label style={labelStyle}>Email or Phone</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter email or phone number"
            style={inputStyle}
          />

          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={inputStyle}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>

            <button type="button" style={linkButtonStyle}>
              Forgot password?
            </button>
          </div>

          {error && (
            <p
              style={{
                color: "#b42318",
                background: "#fef3f2",
                border: "1px solid #fecdca",
                padding: "12px",
                borderRadius: "12px",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              {error}
            </p>
          )}

          <button onClick={handleSignIn} style={buttonStyle}>
            Sign In
          </button>

          <p style={{ textAlign: "center", marginTop: "24px", color: "#667085" }}>
            New here?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              style={linkButtonStyle}
            >
              Create an account
            </button>
          </p>

          <p
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "12px",
              color: "#98a2b3",
              lineHeight: "1.6",
            }}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </section>

        <div style={{ flex: 1, position: "relative" }}>
          <img
            src="/staircase.jpg"
            alt="Building"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: "28px",
              left: "28px",
              right: "28px",
              background: "rgba(255,255,255,0.94)",
              padding: "24px",
              borderRadius: "22px",
              backdropFilter: "blur(10px)",
              boxShadow: "0 16px 40px rgba(16,24,40,0.18)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "22px" }}>
              Practice calls. Get feedback. Improve faster.
            </h3>

            <p style={{ margin: 0, color: "#667085", lineHeight: "1.6" }}>
              Train with realistic AI customer conversations and receive focused
              coaching after every session.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

const badgeStyle = {
  display: "inline-block",
  width: "fit-content",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#e7f4ef",
  color: "#006b4f",
  fontWeight: 800,
  fontSize: "13px",
};

const featureListStyle = {
  display: "grid",
  gap: "8px",
  marginBottom: "28px",
  color: "#344054",
  fontSize: "14px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 700,
  color: "#344054",
};

const inputStyle = {
  width: "100%",
  padding: "15px",
  borderRadius: "14px",
  border: "1px solid #d0d5dd",
  marginBottom: "18px",
  fontSize: "15px",
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  width: "100%",
  padding: "15px",
  borderRadius: "14px",
  border: "none",
  background: "#006b4f",
  color: "white",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(0,107,79,0.22)",
};

const linkButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#006b4f",
  cursor: "pointer",
  fontWeight: 800,
};