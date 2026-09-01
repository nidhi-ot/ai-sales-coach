"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { API_BASE_URL } from "../lib/api";

export default function RequestAccessForm() {
  const t = useTranslations("Home.contact");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(`${API_BASE_URL}/access-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          company: formData.get("company") || null,
          message: formData.get("message"),
          website: formData.get("website") || null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { detail?: string }
          | null;
        throw new Error(data?.detail || t("error"));
      }

      form.reset();
      setSuccess(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={rowStyle}>
        <label style={labelStyle}>
          {t("fields.name")}
          <input name="name" required maxLength={120} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          {t("fields.email")}
          <input name="email" type="email" required maxLength={254} style={inputStyle} />
        </label>
      </div>

      <label style={labelStyle}>
        {t("fields.company")}
        <input name="company" maxLength={160} style={inputStyle} />
      </label>

      <label style={labelStyle}>
        {t("fields.message")}
        <textarea name="message" required maxLength={4000} rows={5} style={textareaStyle} />
      </label>

      <label style={honeypotStyle} aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <p style={noteStyle}>{t("deliveryNote")}</p>
      {success && <p style={successStyle}>{t("success")}</p>}
      {error && <p style={errorStyle}>{error}</p>}

      <div style={actionsStyle}>
        <button type="submit" disabled={submitting} style={submitStyle}>
          {submitting ? t("sending") : t("send")}
        </button>
        <Link href="/login" style={secondaryStyle}>
          {t("existingUser")}
        </Link>
      </div>
    </form>
  );
}

const formStyle = { display: "grid", gap: "18px", width: "100%", maxWidth: "650px" };
const rowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: "16px",
};
const labelStyle = {
  display: "grid",
  gap: "8px",
  color: "#344054",
  fontSize: "14px",
  fontWeight: 700,
};
const inputStyle = {
  width: "100%",
  minHeight: "48px",
  borderRadius: "14px",
  boxSizing: "border-box" as const,
  border: "1px solid rgba(148,163,184,0.55)",
  background: "rgba(255,255,255,0.86)",
  padding: "0 14px",
  color: "#101828",
  font: "inherit",
  outlineColor: "#006b4f",
};
const textareaStyle = {
  ...inputStyle,
  minHeight: "140px",
  padding: "14px",
  resize: "vertical" as const,
};
const honeypotStyle = { position: "absolute" as const, left: "-10000px", opacity: 0 };
const noteStyle = { margin: 0, color: "#667085", fontSize: "13px" };
const successStyle = {
  margin: 0,
  color: "#027a48",
  background: "#ecfdf3",
  border: "1px solid #abefc6",
  borderRadius: "12px",
  padding: "12px 14px",
};
const errorStyle = {
  margin: 0,
  color: "#b42318",
  background: "#fef3f2",
  border: "1px solid #fecdca",
  borderRadius: "12px",
  padding: "12px 14px",
};
const actionsStyle = { display: "flex", gap: "12px", flexWrap: "wrap" as const };
const submitStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "48px",
  padding: "0 22px",
  borderRadius: "14px",
  border: "none",
  background: "#006b4f",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  font: "inherit",
};
const secondaryStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "48px",
  padding: "0 22px",
  borderRadius: "14px",
  border: "1px solid #b7ddd0",
  background: "white",
  color: "#006b4f",
  fontWeight: 800,
  textDecoration: "none",
};
