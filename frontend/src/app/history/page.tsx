"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { API_BASE_URL, authFetch } from "../../lib/api";

type Session = {
  id: string;
  scenario: string;
  started_at: string;
  duration_seconds: number | null;
  status: string;
  overall_score?: number | null;
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const repId = localStorage.getItem("rep_id");

    if (!repId) {
      setLoading(false);
      return;
    }

    authFetch(`${API_BASE_URL}/sessions/rep/${repId}`)
      .then((res) => res.json())
      .then((data) => {
        const safeSessions = Array.isArray(data)
          ? data.map((session) => ({
              ...session,
              overall_score: session.overall_score ?? null,
            }))
          : [];

        setSessions(safeSessions);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load sessions:", error);
        setLoading(false);
      });
  }, []);


  const completedCount = sessions.filter(
    (session) => session.status === "completed"
  ).length;

  const activeCount = sessions.filter(
    (session) => session.status !== "completed"
  ).length;

  const latestSession = sessions[0];

  return (
    <AppShell>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Practice History</p>

            <h1 style={heroTitleStyle}>Session History</h1>

            <p style={heroSubtitleStyle}>
              Review previous AI Sales Coach practice sessions, scorecards, and
              manager sharing status.
            </p>
          </div>

          <button
            onClick={() => router.push("/scenarios")}
            style={primaryButtonStyle}
          >
            Start New Practice →
          </button>
        </section>

        <div style={statsGridStyle}>
          <StatBox title="Total Sessions" value={sessions.length} icon="🎙️" />
          <StatBox title="Completed" value={completedCount} icon="✅" />
          <StatBox title="Active / Draft" value={activeCount} icon="⏳" />
          <StatBox
            title="Latest Practice"
            value={
              latestSession?.started_at
                ? new Date(latestSession.started_at).toLocaleDateString()
                : "-"
            }
            icon="🕘"
          />
        </div>

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Practice Sessions</h2>
              <p style={sectionSubtitleStyle}>
                Select a session to view its scorecard.
              </p>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "#667085" }}>Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: "42px" }}>🎯</div>
              <h3 style={{ marginBottom: "8px" }}>No practice sessions yet</h3>
              <p style={{ color: "#667085" }}>
                Start your first practice call to see history here.
              </p>

              <button
                onClick={() => router.push("/scenarios")}
                style={primaryButtonStyle}
              >
                Start Practice
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px", marginTop: "22px" }}>
              {sessions.map((session) => {
                const completed = session.status === "completed";

                return (
                  <div key={session.id} style={sessionCardStyle}>
                    <div style={scenarioIconStyle}>🎙️</div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h3 style={{ margin: 0, color: "#101828" }}>
                          {formatScenario(session.scenario)}
                        </h3>

                        <span
                          style={{
                            ...statusBadgeBase,
                            background: completed ? "#e7f4ef" : "#fff4e5",
                            color: completed ? "#027a48" : "#b54708",
                          }}
                        >
                          {session.status}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: "8px 0 0",
                          color: "#667085",
                          fontSize: "14px",
                        }}
                      >
                        {session.started_at
                          ? new Date(session.started_at).toLocaleString()
                          : "-"}{" "}
                        • Duration:{" "}
                        {formatDuration(session.duration_seconds)}
                      </p>
                    </div>

                    <div style={scorePillStyle}>
                      {session.overall_score != null
                        ? `${session.overall_score}/10`
                        : "Not scored"}
                    </div>

                    <div style={buttonGroupStyle}>
                      <button
                        onClick={() => router.push(`/sessions/${session.id}`)}
                        style={secondaryButtonStyle}
                      >
                        View Details
                      </button>

                      <button
                        onClick={() =>
                          router.push(`/scorecards?session_id=${session.id}`)
                        }
                        style={viewButtonStyle}
                      >
                        View Scorecard
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatBox({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div style={statBoxStyle}>
      <div>
        <p style={{ margin: 0, color: "#667085", fontSize: "14px" }}>{title}</p>
        <h2 style={{ margin: "10px 0 0", color: "#101828", fontSize: "30px" }}>
          {value}
        </h2>
      </div>

      <div style={statIconStyle}>{icon}</div>
    </div>
  );
}

function formatScenario(value: string) {
  return value
    .replace("_", " ")
    .replace("direct sales", "Direct sales")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) return "--";
  if (seconds === 0) return "0s";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (!minutes) return `${remainingSeconds}s`;

  return `${minutes}m ${remainingSeconds}s`;
}

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
  border: "1px solid #dfeee8",
  borderRadius: "28px",
  padding: "34px",
  boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
  marginBottom: "28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#006b4f",
  fontWeight: 800,
  fontSize: "14px",
};

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "36px",
  fontWeight: 900,
  color: "#101828",
};

const heroSubtitleStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "16px",
  maxWidth: "680px",
  lineHeight: "1.6",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "18px",
  marginBottom: "28px",
};

const statBoxStyle: React.CSSProperties = {
  background: "white",
  padding: "22px",
  borderRadius: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 12px 30px rgba(16,24,40,0.06)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const statIconStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "16px",
  background: "#e7f4ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
};

const panelStyle: React.CSSProperties = {
  background: "white",
  padding: "26px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  color: "#101828",
};

const sectionSubtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#667085",
};

const emptyStateStyle: React.CSSProperties = {
  marginTop: "22px",
  padding: "48px",
  borderRadius: "22px",
  background: "#f9fafb",
  border: "1px dashed #d0d5dd",
  textAlign: "center",
};

const sessionCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "18px",
  borderRadius: "20px",
  background: "#fcfcfd",
  border: "1px solid #eef2f6",
};

const scenarioIconStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "16px",
  background: "#e7f4ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
};

const statusBadgeBase: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
};

const scorePillStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#e7f4ef",
  color: "#006b4f",
  fontSize: "13px",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const viewButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: "12px",
  border: "none",
  background: "#006b4f",
  color: "white",
  cursor: "pointer",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const buttonGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: "12px",
  border: "1px solid #d0d5dd",
  background: "white",
  color: "#006b4f",
  cursor: "pointer",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "14px 24px",
  borderRadius: "14px",
  border: "none",
  background: "#006b4f",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(0,107,79,0.22)",
  whiteSpace: "nowrap",
};
