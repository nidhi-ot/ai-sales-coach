"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import StatCard from "../../components/dashboard/StatCard";

type DashboardStats = {
  total_calls: number;
  avg_score: number | null;
  best_score: number | null;
  last_call_date: string | null;
  improvement_rate?: number | null;
};

type RecentSession = {
  id: string;
  title?: string;
  scenario: string;
  score?: number | null;
  date?: string | null;
  duration?: number | null;
};

type DimensionStats = {
  avg?: number;
  latest?: number;
  count?: number;
};

type DimensionsResponse = {
  dimensions?: {
    objection_handling?: DimensionStats;
    discovery?: DimensionStats;
    closing?: DimensionStats;
  };
};

export default function DashboardPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("Sales Rep");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [dimensions, setDimensions] = useState<DimensionsResponse["dimensions"]>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem("full_name");

    if (storedName && storedName !== "undefined") {
      setFullName(storedName);
    }

    async function loadDashboardData() {
  try {
    const repId = localStorage.getItem("rep_id");

    if (!repId) {
      setLoading(false);
      return;
    }

    const [statsResponse, recentResponse, dimensionsResponse] =
      await Promise.all([
        fetch(`http://127.0.0.1:8000/api/v1/sessions/stats/${repId}`),
        fetch(`http://127.0.0.1:8000/api/v1/sessions/recent/${repId}?limit=5`),
        fetch(`http://127.0.0.1:8000/api/v1/sessions/dimensions/${repId}`),
      ]);

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      setStats(statsData);
    }

    if (recentResponse.ok) {
      const recentData = await recentResponse.json();
      setRecentSessions(recentData.sessions || []);
    }

    if (dimensionsResponse.ok) {
      const dimensionsData = await dimensionsResponse.json();
      setDimensions(dimensionsData.dimensions || {});
    }
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  } finally {
    setLoading(false);
  }
}

    loadDashboardData();
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <div style={heroInnerStyle}>
            <div>
              <p style={eyebrowStyle}>AI Sales Coach Dashboard</p>

              <h1 style={heroTitleStyle}>Good Morning, {fullName} 👋</h1>

              <p style={heroSubtitleStyle}>
                Ready to level up your sales game today?
              </p>
            </div>

            <button
              onClick={() => router.push("/scenarios")}
              style={primaryButtonStyle}
            >
              Start Practice →
            </button>
          </div>
        </section>

        <div style={statsGridStyle}>
          <StatCard
            title="Practice Calls"
            value={loading ? "..." : stats?.total_calls ?? 0}
            subtitle="Total completed calls"
            icon="☎️"
          />

          <StatCard
            title="Average Score"
            value={
              loading
                ? "..."
                : stats?.avg_score !== null && stats?.avg_score !== undefined
                  ? stats.avg_score.toFixed(1)
                  : "--"
            }
            subtitle="Based on scorecards"
            icon="📊"
          />

          <StatCard
            title="Best Score"
            value={
              loading
                ? "..."
                : stats?.best_score !== null && stats?.best_score !== undefined
                  ? stats.best_score.toFixed(1)
                  : "--"
            }
            subtitle="Personal best"
            icon="🏆"
          />

          <StatCard
            title="Last Practice"
            value={
              loading
                ? "..."
                : stats?.last_call_date
                  ? new Date(stats.last_call_date).toLocaleDateString()
                  : "--"
            }
            subtitle={
              stats?.improvement_rate !== null &&
              stats?.improvement_rate !== undefined
                ? `${stats.improvement_rate}% improvement`
                : "No trend yet"
            }
            icon="🎯"
          />
        </div>

        <div style={mainGridStyle}>
          <section style={panelStyle}>
            <div style={headerStyle}>
              <div>
                <h2 style={titleStyle}>Recent Practice</h2>
                <p style={subtitleStyle}>Your latest training sessions</p>
              </div>

              <button
                onClick={() => router.push("/history")}
                style={linkButtonStyle}
              >
                View all
              </button>
            </div>

            {loading ? (
              <p style={{ color: "#667085", marginTop: "20px" }}>
                Loading recent sessions...
              </p>
            ) : recentSessions.length === 0 ? (
              <p style={{ color: "#667085", marginTop: "20px" }}>
                No practice sessions yet.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "14px", marginTop: "20px" }}>
                {recentSessions.map((session) => (
                  <div key={session.id} style={sessionStyle}>
                    <div style={sessionIconStyle}>🎙️</div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ color: "#101828" }}>
                        {formatScenario(session.scenario)}
                      </strong>

                      <p style={sessionDateStyle}>
                        {session.date
                          ? new Date(session.date).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>

                    <span style={scoreStyle}>
                      {session.score !== null && session.score !== undefined
                        ? `${session.score}/10`
                        : "--"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={panelStyle}>
            <div style={headerStyle}>
              <div>
                <h2 style={titleStyle}>Your Progress</h2>
                <p style={subtitleStyle}>Skill growth overview</p>
              </div>
            </div>

            <div style={{ marginTop: "22px", display: "grid", gap: "18px" }}>
              <ProgressRow
                label="Discovery"
                score={dimensions?.discovery?.latest}
              />

              <ProgressRow
                label="Objection Handling"
                score={dimensions?.objection_handling?.latest}
              />

              <ProgressRow label="Closing" score={dimensions?.closing?.latest} />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function ProgressRow({
  label,
  score,
}: {
  label: string;
  score: number | undefined;
}) {
  const safeScore = score ?? 0;
  const percentage = Math.min(safeScore * 10, 100);

  return (
    <div>
      <div style={progressHeaderStyle}>
        <span>{label}</span>
        <span>{score !== undefined ? `${safeScore.toFixed(1)}/10` : "--"}</span>
      </div>

      <div style={progressBgStyle}>
        <div style={{ ...progressFillStyle, width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function formatScenario(value: string) {
  return value
    .replace("_", " ")
    .replace("direct sales", "Direct Sales")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
  border: "1px solid #dfeee8",
  borderRadius: "28px",
  padding: "32px",
  boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
  marginBottom: "28px",
};

const heroInnerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  alignItems: "center",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#006b4f",
  fontWeight: 700,
  fontSize: "14px",
};

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "38px",
  fontWeight: 800,
  color: "#101828",
  letterSpacing: "-0.8px",
};

const heroSubtitleStyle: React.CSSProperties = {
  marginTop: "10px",
  color: "#667085",
  fontSize: "17px",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "16px 24px",
  borderRadius: "16px",
  border: "none",
  background: "#006b4f",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(0, 107, 79, 0.24)",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
  marginBottom: "28px",
};

const mainGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: "24px",
};

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

const sessionIconStyle: React.CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  background: "#e7f4ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
};

const sessionDateStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#667085",
  fontSize: "14px",
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

const progressHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  fontWeight: 700,
  color: "#344054",
};

const progressBgStyle: React.CSSProperties = {
  height: "10px",
  background: "#eef2f6",
  borderRadius: "999px",
  overflow: "hidden",
};

const progressFillStyle: React.CSSProperties = {
  height: "100%",
  background: "#006b4f",
  borderRadius: "999px",
};