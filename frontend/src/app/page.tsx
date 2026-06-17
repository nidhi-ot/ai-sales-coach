"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DUMMY_PASSWORD = "demo123";

export default function LoginPage() {
  const router = useRouter();

  const [repId, setRepId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  function handleSignIn() {
    setError("");

    if (!repId.trim()) {
      setError("Please enter your Rep ID");
      return;
    }

    if (!businessId.trim()) {
      setError("Please enter your Business ID");
      return;
    }

    if (password !== DUMMY_PASSWORD) {
      setError("Invalid password");
      return;
    }

    localStorage.setItem("rep_id", repId.trim());
    localStorage.setItem("business_id", businessId.trim());
    localStorage.setItem("remember_me", String(rememberMe));

    router.push("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "1200px",
          height: "720px",
          background: "#fff",
          borderRadius: "28px",
          overflow: "hidden",
          display: "flex",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        }}
      >
        {/* LEFT SIDE */}
        <section
          style={{
            width: "450px",
            padding: "48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* LOGO */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "32px",
            }}
          >
            <img
              src="/logo.png"
              alt="AI Sales Coach"
              style={{
                width: "90px",
                height: "90px",
                objectFit: "contain",
              }}
            />

          </div>

          <h1
            style={{
              marginBottom: "8px",
              color: "#101828",
            }}
          >
            Welcome back!
          </h1>

          <p
            style={{
              color: "#667085",
              marginBottom: "28px",
            }}
          >
            Sign in to continue your sales training journey.
          </p>

          <label style={labelStyle}>Rep ID</label>

          <input
            value={repId}
            onChange={(e) => setRepId(e.target.value)}
            placeholder="Enter your rep_id"
            style={inputStyle}
          />

          <label style={labelStyle}>Business ID</label>

          <input
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            placeholder="Enter your business_id"
            style={inputStyle}
          />

          <label style={labelStyle}>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo123"
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
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>

            <button
              type="button"
              style={{
                border: "none",
                background: "transparent",
                color: "#006b4f",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <p
              style={{
                color: "#b42318",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleSignIn}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "14px",
              border: "none",
              background: "#006b4f",
              color: "white",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              color: "#667085",
            }}
          >
            New here?{" "}
            <span
              style={{
                color: "#006b4f",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Create an account
            </span>
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

        {/* RIGHT SIDE IMAGE */}
        <div
          style={{
            flex: 1,
            position: "relative",
          }}
        >
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
              bottom: "24px",
              left: "24px",
              right: "24px",
              background: "rgba(255,255,255,0.95)",
              padding: "20px",
              borderRadius: "18px",
              backdropFilter: "blur(8px)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "8px",
              }}
            >
              AI Sales Coach
            </h3>

            <p
              style={{
                margin: 0,
                color: "#667085",
                lineHeight: "1.6",
              }}
            >
              Improve sales conversations through realistic practice scenarios,
              AI coaching, and performance feedback.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 600,
  color: "#344054",
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #d0d5dd",
  marginBottom: "18px",
  fontSize: "15px",
  boxSizing: "border-box" as const,
};