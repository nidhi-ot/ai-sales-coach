"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteToken, setInviteToken] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInviteToken(params.get("invite") ?? "");
  }, []);

  async function handleCreateAccount() {
    setError("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone_number: phoneNumber.trim(),
          password,
          invite_token: inviteToken || undefined,
          employee_id: employeeId.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Account creation failed");
        return;
      }

      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("rep_id", data.rep_id || data.user_id);
      localStorage.setItem("business_id", data.business_id);
      localStorage.setItem("full_name", data.full_name);
      localStorage.setItem("email", data.email || "");
      localStorage.setItem("phone_number", data.phone_number || "");
      if (data.employee_id) {
        localStorage.setItem("employee_id", data.employee_id);
      }
      localStorage.setItem("role", data.role || "rep");

      setSuccessMessage("Account created successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Could not connect to backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src="/logo.png"
            alt="AI Sales Coach"
            style={{
              width: "110px",
              height: "110px",
              objectFit: "contain",
            }}
          />

          <h1 style={{ marginBottom: "8px" }}>Create Account</h1>

          <p style={{ color: "#667085" }}>
            Join AI Sales Coach and start your practice journey.
          </p>
        </div>

        <label style={labelStyle}>Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          style={inputStyle}
        />

        <label style={labelStyle}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          type="email"
          style={inputStyle}
        />

        <label style={labelStyle}>Phone Number</label>
        <input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter your phone number"
          style={inputStyle}
        />

        <label style={labelStyle}>Employee ID</label>
        <input
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder="Optional employee ID"
          style={inputStyle}
        />

        {!inviteToken && (
          <p style={{ color: "#b54708", fontSize: "14px", marginTop: "-4px" }}>
            Invite token missing. This signup will only work if open signup is enabled.
          </p>
        )}

        <label style={labelStyle}>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create password"
          type="password"
          style={inputStyle}
        />

        <label style={labelStyle}>Confirm Password</label>
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          type="password"
          style={inputStyle}
        />

        {error && <p style={{ color: "#b42318", fontSize: "14px" }}>{error}</p>}

        {successMessage && (
          <p style={{ color: "#027a48", fontSize: "14px" }}>{successMessage}</p>
        )}

        <button onClick={handleCreateAccount} disabled={loading} style={buttonStyle}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p style={{ textAlign: "center", marginTop: "22px", color: "#667085" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={linkButtonStyle}
          >
            Sign in
          </button>
        </p>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f7f5",
  display: "grid",
  placeItems: "center",
  padding: "32px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle = {
  width: "460px",
  background: "white",
  padding: "40px",
  borderRadius: "24px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
};

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
  marginBottom: "16px",
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
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
  marginTop: "8px",
};

const linkButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#006b4f",
  fontWeight: 700,
  cursor: "pointer",
};
