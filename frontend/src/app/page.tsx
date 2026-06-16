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
        background: "#f6f8f7",
        display: "grid",
        placeItems: "center",
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "420px",
          background: "white",
          padding: "36px",
          borderRadius: "24px",
          boxShadow: "0 14px 40px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "16px",
              background: "#006b4f",
              color: "white",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            AI
          </div>

          <h1 style={{ margin: 0 }}>AI Sales Coach</h1>

          <p style={{ marginTop: "10px", color: "#667085", lineHeight: "1.5" }}>
            Practice. Improve. Close more deals.
          </p>
        </div>

        <h2 style={{ marginBottom: "6px" }}>Welcome back!</h2>

        <p style={{ color: "#667085", marginBottom: "24px" }}>
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="demo123"
          type="password"
          style={inputStyle}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            fontSize: "14px",
          }}
        >
          <label
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              color: "#344054",
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

        {error && <p style={{ color: "#b42318", fontSize: "14px" }}>{error}</p>}

        <button onClick={handleSignIn} style={buttonStyle}>
          Sign In
        </button>

        <p
          style={{
            textAlign: "center",
            color: "#667085",
            fontSize: "14px",
            marginTop: "22px",
          }}
        >
          New here?{" "}
          <button
            type="button"
            style={{
              border: "none",
              background: "transparent",
              color: "#006b4f",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Create an account
          </button>
        </p>

        <p
          style={{
            textAlign: "center",
            color: "#98a2b3",
            fontSize: "12px",
            marginTop: "18px",
            lineHeight: "1.5",
          }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </section>
    </main>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "#344054",
  marginBottom: "8px",
};

const inputStyle = {
  width: "100%",
  padding: "13px",
  marginBottom: "16px",
  borderRadius: "12px",
  border: "1px solid #d0d5dd",
  fontSize: "15px",
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "#006b4f",
  color: "white",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
};