"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

export default function ProfilePage() {
  const [fullName, setFullName] = useState("Sales Rep");
  const [email, setEmail] = useState("-");
  const [phone, setPhone] = useState("-");
  const [role, setRole] = useState("rep");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFullName(localStorage.getItem("full_name") || "Sales Rep");
    setEmail(localStorage.getItem("email") || "-");
    setPhone(localStorage.getItem("phone_number") || "-");
    setRole(localStorage.getItem("role") || "rep");
    setLoaded(true);
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <p style={eyebrowStyle}>Sales Profile</p>
          <h1 style={titleStyle}>Your Profile</h1>
          <p style={subtitleStyle}>
            Manage your AI Sales Coach account information.
          </p>
        </section>

        <section style={panelStyle}>
          <div style={avatarStyle}>{fullName.charAt(0).toUpperCase()}</div>

          <h2 style={{ marginBottom: "4px" }}>{fullName}</h2>
          <p style={{ color: "#667085", marginTop: 0 }}>
            {loaded ? "Sales Representative" : "Loading profile..."}
          </p>

          <div style={gridStyle}>
            <InfoCard label="Email" value={email} />
            <InfoCard label="Phone Number" value={phone} />
            <InfoCard label="Role" value={role} />
            <InfoCard label="Business" value="AI Sales Coach" />
          </div>

          <p style={{ color: "#667085", margin: "20px 0 0" }}>
            {loaded
              ? "This profile mirrors the values stored in your local app session."
              : "Fetching your local profile details..."}
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
