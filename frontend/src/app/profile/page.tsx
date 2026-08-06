"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import AppShell from "../../components/AppShell";

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("-");
  const [phone, setPhone] = useState("-");
  const [employeeId, setEmployeeId] = useState("-");
  const [role, setRole] = useState("rep");

  useEffect(() => {
    setFullName(localStorage.getItem("full_name") || t("fallbackName"));
    setEmail(localStorage.getItem("email") || "-");
    setPhone(localStorage.getItem("phone_number") || "-");
    setEmployeeId(localStorage.getItem("employee_id") || "-");
    setRole(localStorage.getItem("role") || "rep");
  }, [t]);

  const displayName = fullName || t("fallbackName");
  const displayRole =
    role === "admin"
      ? t("roles.admin")
      : role === "manager"
        ? t("roles.manager")
        : t("roles.rep");

  return (
    <AppShell>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <p style={eyebrowStyle}>{t("eyebrow")}</p>
          <h1 style={titleStyle}>{t("title")}</h1>
          <p style={subtitleStyle}>{t("subtitle")}</p>
        </section>

        <section style={panelStyle}>
          <div style={avatarStyle}>{displayName.charAt(0).toUpperCase()}</div>

          <h2 style={{ marginBottom: "4px" }}>{displayName}</h2>
          <p style={{ color: "#667085", marginTop: 0 }}>{displayRole}</p>

          <div style={gridStyle}>
            <InfoCard label={t("fields.email")} value={email} />
            <InfoCard label={t("fields.phoneNumber")} value={phone} />
            <InfoCard label={t("fields.employeeId")} value={employeeId} />
            <InfoCard label={t("fields.role")} value={displayRole} />
            <InfoCard label={t("fields.business")} value="AI Sales Coach" />
          </div>

          <p style={{ color: "#667085", margin: "20px 0 0" }}>
            {t("localSessionNote")}
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCardStyle}>
      <p style={{ margin: 0, color: "#667085", fontSize: "14px" }}>{label}</p>
      <strong style={{ color: "#101828" }}>{value}</strong>
    </div>
  );
}

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
  border: "1px solid #dfeee8",
  borderRadius: "28px",
  padding: "34px",
  boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
  marginBottom: "28px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#006b4f",
  fontWeight: 800,
  fontSize: "14px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "36px",
  fontWeight: 900,
  color: "#101828",
};

const subtitleStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "16px",
};

const panelStyle: React.CSSProperties = {
  background: "white",
  padding: "34px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
};

const avatarStyle: React.CSSProperties = {
  width: "92px",
  height: "92px",
  borderRadius: "999px",
  background: "#006b4f",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "36px",
  fontWeight: 900,
  marginBottom: "18px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "16px",
  marginTop: "26px",
};

const infoCardStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #eef2f6",
  borderRadius: "18px",
  padding: "18px",
};
