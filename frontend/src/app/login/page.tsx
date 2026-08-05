"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { API_BASE_URL } from "../../lib/api";
import { applyBusinessLanguage } from "../../lib/businessLanguage";


export default function LoginPage() {
  const t = useTranslations("Login");
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    setError("");

    if (!identifier.trim()) {
      setError(t("errors.identifierRequired"));
      return;
    }

    if (!password.trim()) {
      setError(t("errors.passwordRequired"));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
        setError(data.detail || t("errors.loginFailed"));
        return;
      }

      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("access_token", data.access_token || "");
      localStorage.setItem("rep_id", data.rep_id || data.user_id);
      localStorage.setItem("business_id", data.business_id);
      applyBusinessLanguage(data.business_language);
      localStorage.setItem("full_name", data.full_name || "Sales Rep");
      localStorage.setItem("email", data.email || "");
      localStorage.setItem("phone_number", data.phone_number || "");
      localStorage.setItem("employee_id", data.employee_id || "");
      localStorage.setItem("role", data.role || "rep");
      localStorage.setItem("remember_me", String(rememberMe));
      localStorage.removeItem("last_session_id");

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setError(t("errors.backendConnection"));
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
            alt={t("logoAlt")}
            style={{
              width: "76px",
              height: "76px",
              objectFit: "contain",
              marginBottom: "26px",
            }}
          />

          <span style={badgeStyle}>{t("badge")}</span>

          <h1
            style={{
              margin: "18px 0 8px",
              color: "#101828",
              fontSize: "34px",
              fontWeight: 900,
            }}
          >
            {t("title")}
          </h1>

          <label style={labelStyle}>{t("identifierLabel")}</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t("identifierPlaceholder")}
            style={inputStyle}
          />

          <label style={labelStyle}>{t("passwordLabel")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
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
              {t("rememberMe")}
            </label>

            <button type="button" style={linkButtonStyle}>
              {t("forgotPassword")}
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
            {t("signIn")}
          </button>

          <p style={{ textAlign: "center", marginTop: "24px", color: "#667085" }}>
            {t("newHere")}{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              style={linkButtonStyle}
            >
              {t("createAccount")}
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
            {t("legal")}
          </p>
        </section>

        <div style={{ flex: 1, position: "relative" }}>
          <img
            src="/staircase.jpg"
            alt={t("imageAlt")}
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
              {t("promoTitle")}
            </h3>

            <p style={{ margin: 0, color: "#667085", lineHeight: "1.6" }}>
              {t("promoBody")}
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
