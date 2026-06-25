// frontend/src/app/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import StatCard from "../../components/dashboard/StatCard";

type Stats = {
  total_calls: number;
  avg_score: string;
  best_score: string;
  last_call_date: string;
};

type RecentSession = {
  id: string;
  scenario: string;
  score: string;
  date: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("Sales Rep");

  const [stats, setStats] = useState<Stats>({
    total_calls: 0,
    avg_score: "--",
    best_score: "--",
    last_call_date: "--",
  });

  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  useEffect(() => {
    const storedName = localStorage.getItem("full_name");

    if (storedName && storedName !== "undefined") {
      setFullName(storedName);
    }

    // Temporary mock data until backend stats endpoints are ready.
    setStats({
      total_calls: 12,
      avg_score: "8.1",
      best_score: "9.4",
      last_call_date: "Today",
    });

    setRecentSessions([
      {
        id: "1",
        scenario: "Cold Call",
        score: "82%",
        date: "Today",
      },
      {
        id: "2",
        scenario: "Hot Call",
        score: "76%",
        date: "Yesterday",
      },
      {
        id: "3",
        scenario: "Meeting",
        score: "88%",
        date: "Monday",
      },
      {
        id: "4",
        scenario: "Direktförsäljning",
        score: "72%",
        date: "Last week",
      },
    ]);
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
          Good Morning, {fullName} 👋
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
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginTop: "32px",
        }}
      >
        <StatCard title="Practice Calls" value={stats.total_calls} icon="☎️" />
        <StatCard title="Average Score" value={stats.avg_score} icon="📊" />
        <StatCard title="Best Score" value={stats.best_score} icon="🏆" />
        <StatCard title="Last Call" value={stats.last_call_date} icon="🕘" />
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "20px",
          marginTop: "32px",
        }}
      >
        <section
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "18px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <h2 style={{ margin: 0, color: "#101828" }}>Recent Practice</h2>

            <button
              onClick={() => router.push("/history")}
              style={{
                border: "none",
                background: "transparent",
                color: "#006b4f",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              View all
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <p style={{ color: "#667085" }}>No practice sessions yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "1px solid #f2f4f7",
                    background: "#fcfcfd",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: "#101828",
                      }}
                    >
                      {session.scenario}
                    </p>

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

                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: "#e7f4ef",
                      color: "#027a48",
                      fontWeight: 700,
                      fontSize: "13px",
                    }}
                  >
                    {session.score}
                  </span>

                  <button
                    onClick={() => router.push("/scorecards")}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#006b4f",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "18px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#101828" }}>Your Progress</h2>

          <p style={{ color: "#667085", lineHeight: "1.6" }}>
            Your progress summary will show trends after more practice sessions.
          </p>

          <div
            style={{
              marginTop: "24px",
              height: "150px",
              borderRadius: "16px",
              background: "#f9fafb",
              border: "1px dashed #d0d5dd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#667085",
              fontWeight: 600,
            }}
          >
            Progress chart coming soon
          </div>
        </section>
      </div>
    </AppShell>
  );
}