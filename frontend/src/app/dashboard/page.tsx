"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";

export default function DashboardPage() {
  const router = useRouter();
  const [repId, setRepId] = useState("rep");

  useEffect(() => {
    const storedRepId = localStorage.getItem("rep_id");
    if (storedRepId) {
      setRepId(storedRepId);
    }
  }, []);

  return (
    <AppShell>
      <div style={{ marginBottom: "24px" }}>
  <h1
    style={{
      margin: 0,
      fontSize: "32px",
      fontWeight: 700,
      color: "#101828",
    }}
  >
    Good Morning, {repId} 👋
  </h1>

  <p
    style={{
      marginTop: "8px",
      color: "#667085",
      fontSize: "16px",
    }}
  >
    Ready to level up your sales game today?
  </p>
</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginTop: "32px",
        }}
      >
        <Card title="Practice Calls" value="0" />
        <Card title="Average Score" value="--" />
        <Card title="Current Focus" value="Cold Call" />
      </div>

      <button
        onClick={() => router.push("/scenarios")}
        style={{
          marginTop: "32px",
          padding: "14px 24px",
          borderRadius: "12px",
          border: "none",
          background: "#006b4f",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Start Practice
      </button>
    </AppShell>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        background: "white",
        padding: "24px",
        borderRadius: "18px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
      }}
    >
      <p style={{ color: "#667085" }}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}