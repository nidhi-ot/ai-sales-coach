"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import StatCard from "../../components/dashboard/StatCard";

type RecentSession = {
  id: string;
  scenario: string;
  score: string;
  date: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("Sales Rep");

  const recentSessions: RecentSession[] = [
    { id: "1", scenario: "Cold Call", score: "82%", date: "Today" },
    { id: "2", scenario: "Hot Call", score: "76%", date: "Yesterday" },
    { id: "3", scenario: "Meeting", score: "88%", date: "Monday" },
  ];

  useEffect(() => {
    const storedName = localStorage.getItem("full_name");

    if (storedName && storedName !== "undefined") {
      setFullName(storedName);
    }
  }, []);

  return (
    <AppShell>
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <section
          style={{
            background:
              "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
            border: "1px solid #dfeee8",
            borderRadius: "28px",
            padding: "32px",
            boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "24px",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  color: "#006b4f",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                AI Sales Coach Dashboard
              </p>

              <h1
                style={{
                  margin: 0,
                  fontSize: "38px",
                  fontWeight: 800,
                  color: "#101828",
                  letterSpacing: "-0.8px",
                }}
              >
                Good Morning, {fullName} 👋
              </h1>

              <p
                style={{
                  marginTop: "10px",
                  color: "#667085",
                  fontSize: "17px",
                }}
              >
                Ready to level up your sales game today?
              </p>
            </div>

            <button
              onClick={() => router.push("/scenarios")}
              style={{
                padding: "16px 24px",
                borderRadius: "16px",
                border: "none",
                background: "#006b4f",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 12px 24px rgba(0, 107, 79, 0.24)",
              }}
            >
              Start Practice →
            </button>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <StatCard title="Practice Calls" value="12" subtitle="+2 this week" icon="☎️" />
          <StatCard title="Average Score" value="8.1" subtitle="+8% improvement" icon="📊" />
          <StatCard title="Best Score" value="9.4" subtitle="Personal best" icon="🏆" />
          <StatCard title="Focus Area" value="Cold Call" subtitle="Recommended next" icon="🎯" />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "24px",
          }}
        >
          <section style={panelStyle}>
            <div style={headerStyle}>
              <div>
                <h2 style={titleStyle}>Recent Practice</h2>
                <p style={subtitleStyle}>Your latest training sessions</p>
              </div>

              <button onClick={() => router.push("/history")} style={linkButtonStyle}>
                View all
              </button>
            </div>

            <div style={{ display: "grid", gap: "14px", marginTop: "20px" }}>
              {recentSessions.map((session) => (
                <div key={session.id} style={sessionStyle}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "14px",
                      background: "#e7f4ef",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    🎙️
                  </div>

                  <div style={{ flex: 1 }}>
                    <strong style={{ color: "#101828" }}>{session.scenario}</strong>
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#667085",
                        fontSize: "14px",
                      }}
                    >
                      {session.date}
                    </p>
                  </div>

                  <span style={scoreStyle}>{session.score}</span>
                </div>
              ))}
            </div>
          </section>

          <section style={panelStyle}>
            <div style={headerStyle}>
              <div>
                <h2 style={titleStyle}>Your Progress</h2>
                <p style={subtitleStyle}>Skill growth overview</p>
              </div>
            </div>

            <div style={{ marginTop: "22px", display: "grid", gap: "18px" }}>
              <ProgressRow label="Discovery" value={82} />
              <ProgressRow label="Objection Handling" value={62} />
              <ProgressRow label="Closing" value={75} />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
          fontWeight: 700,
          color: "#344054",
        }}
      >
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div
        style={{
          height: "10px",
          background: "#eef2f6",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: "#006b4f",
            borderRadius: "999px",
          }}
        />
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "white",
  padding: "26px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  color: "#101828",
};

const subtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#667085",
  fontSize: "14px",
};

const sessionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "16px",
  borderRadius: "18px",
  background: "#fcfcfd",
  border: "1px solid #edf0f3",
};

const scoreStyle: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#e7f4ef",
  color: "#027a48",
  fontWeight: 800,
  fontSize: "13px",
};

const linkButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#006b4f",
  fontWeight: 800,
  cursor: "pointer",
};