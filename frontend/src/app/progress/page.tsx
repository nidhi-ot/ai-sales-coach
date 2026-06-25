"use client";

import AppShell from "../../components/AppShell";

export default function ProgressPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <p style={eyebrowStyle}>Learning Progress</p>
          <h1 style={titleStyle}>Your Progress</h1>
          <p style={subtitleStyle}>
            Track your sales skill development after completed scorecards.
          </p>
        </section>

        <section style={panelStyle}>
          <div style={{ fontSize: "46px", marginBottom: "14px" }}>📈</div>

          <h2 style={{ margin: "0 0 8px", color: "#101828" }}>
            Progress tracking coming soon
          </h2>

          <p style={{ color: "#667085", lineHeight: "1.7", maxWidth: "620px" }}>
            Once you complete more practice calls and scorecards are generated,
            this page will show your skill trends, strongest areas, and focus
            areas over time.
          </p>
        </section>
      </div>
    </AppShell>
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
  padding: "42px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
};