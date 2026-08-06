"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../lib/api";
import { applyBusinessLanguage } from "../../lib/businessLanguage";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("Register");

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
      setError(t("errors.fullNameRequired"));
      return;
    }

    if (!email.trim()) {
      setError(t("errors.emailRequired"));
      return;
    }

    if (!phoneNumber.trim()) {
      setError(t("errors.phoneRequired"));
      return;
    }

    if (!password.trim()) {
      setError(t("errors.passwordRequired"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
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
        setError(data.detail || t("errors.accountCreationFailed"));
        return;
      }

      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("rep_id", data.rep_id || data.user_id);
      localStorage.setItem("business_id", data.business_id);
      applyBusinessLanguage(data.business_language);
      localStorage.setItem("full_name", data.full_name);
      localStorage.setItem("email", data.email || "");
      localStorage.setItem("phone_number", data.phone_number || "");
      if (data.employee_id) {
        localStorage.setItem("employee_id", data.employee_id);
      }
      localStorage.setItem("role", data.role || "rep");

      setSuccessMessage(t("success"));
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : t("errors.backendConnection"));
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
            alt={t("logoAlt")}
            style={{
              width: "110px",
              height: "110px",
              objectFit: "contain",
            }}
          />

          <h1 style={{ marginBottom: "8px" }}>{t("title")}</h1>

          <p style={{ color: "#667085" }}>{t("subtitle")}</p>
        </div>

        <label style={labelStyle}>{t("fullNameLabel")}</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t("fullNamePlaceholder")}
          style={inputStyle}
        />

        <label style={labelStyle}>{t("emailLabel")}</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          type="email"
          style={inputStyle}
        />

        <label style={labelStyle}>{t("phoneLabel")}</label>
        <input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t("phonePlaceholder")}
          style={inputStyle}
        />

        <label style={labelStyle}>{t("employeeIdLabel")}</label>
        <input
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder={t("employeeIdPlaceholder")}
          style={inputStyle}
        />

        {!inviteToken && (
          <p style={{ color: "#b54708", fontSize: "14px", marginTop: "-4px" }}>
            {t("inviteMissing")}
          </p>
        )}

        <label style={labelStyle}>{t("passwordLabel")}</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          type="password"
          style={inputStyle}
        />

        <label style={labelStyle}>{t("confirmPasswordLabel")}</label>
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("confirmPasswordPlaceholder")}
          type="password"
          style={inputStyle}
        />

        {error && <p style={{ color: "#b42318", fontSize: "14px" }}>{error}</p>}

        {successMessage && (
          <p style={{ color: "#027a48", fontSize: "14px" }}>{successMessage}</p>
        )}

        <button onClick={handleCreateAccount} disabled={loading} style={buttonStyle}>
          {loading ? t("creating") : t("createAccount")}
        </button>

        <p style={{ textAlign: "center", marginTop: "22px", color: "#667085" }}>
          {t("alreadyHaveAccount")}{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={linkButtonStyle}
          >
            {t("signIn")}
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
