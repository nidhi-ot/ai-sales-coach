"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import AppShell from "../../components/AppShell";
import StatCard from "../../components/dashboard/StatCard";
import { API_BASE_URL, authFetch } from "../../lib/api";

type DashboardStats = {
  total_calls: number;
  avg_score: number | null;
  best_score: number | null;
  last_call_date: string | null;
  improvement_rate?: number | null;
};

type RecentSession = {
  id: string;
  scenario: string;
  score?: number | null;
  date?: string | null;
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
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [dimensions, setDimensions] = useState<DimensionsResponse["dimensions"]>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedName = localStorage.getItem("full_name");

    setRole(storedRole);

    if (storedName && storedName !== "undefined") {
      setFullName(storedName);
    }

    async function loadDashboardData() {
      try {
        if (storedRole === "manager") {
          setLoading(false);
          return;
        }

        const repId = localStorage.getItem("rep_id");

        if (!repId) {
          setLoading(false);
          return;
        }

        const [statsResponse, recentResponse, dimensionsResponse] =
          await Promise.all([
            authFetch(`${API_BASE_URL}/sessions/stats/${repId}`),
            authFetch(`${API_BASE_URL}/sessions/recent/${repId}?limit=5`),
            authFetch(`${API_BASE_URL}/sessions/dimensions/${repId}`),
          ]);

        if (statsResponse.ok) {
          setStats(await statsResponse.json());
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

  if (role === "admin") {
  return (
    <AppShell>
      <div style={adminPageStyle}>
        <section style={adminHeaderStyle}>
          <div>
            <h1 style={adminTitleStyle}>Admin Workspace</h1>
            <p style={adminSubtitleStyle}>
              Configure how the AI Sales Coach behaves for your organization.
            </p>
          </div>
        </section>

        <section style={adminCardsGridStyle}>
          <AdminOverviewCard
            icon="🏢"
            title="Business Profile"
            rows={[
              ["Status", "Configured"],
              ["Framework", "BANT"],
              ["Language", "Swedish"],
            ]}
            buttonLabel="Edit"
            onClick={() => router.push("/admin?tab=business")}
          />

          <AdminOverviewCard
            icon="🎛️"
            title="Scenario Overrides"
            rows={[
              ["Default Scenarios", "4"],
              ["Customized Scenarios", "1"],
            ]}
            buttonLabel="Configure"
            onClick={() => router.push("/admin?tab=scenarios")}
          />

          <AdminOverviewCard
            icon="👥"
            title="Team Management"
            rows={[
              ["Users", "12"],
              ["Managers", "2"],
              ["Admins", "1"],
            ]}
            buttonLabel="Manage"
            onClick={() => router.push("/admin?tab=team")}
          />
        </section>


        <section style={adminPanelStyle}>
          <h2 style={adminSectionTitleStyle}>Recent Changes</h2>

          <div style={timelineStyle}>
            <RecentChange
              title="Business profile updated"
              time="Today"
              description="Updated company description, target ICP, and sales objectives."
            />
            <RecentChange
              title="Cold Call objective modified"
              time="Recently"
              description="Adjusted conversation goals and success criteria."
            />
            <RecentChange
              title="New manager invited"
              time="Recently"
              description="A manager invite link was created."
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

  if (role === "manager") {
    return <ManagerDashboard fullName={fullName} onViewTeam={() => router.push("/team")} />;
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <div style={heroInnerStyle}>
            <div>
              <p style={eyebrowStyle}>AI Sales Coach Dashboard</p>
              <h1 style={heroTitleStyle}>Good Morning, {fullName} 👋</h1>
              <p style={heroSubtitleStyle}>Ready to level up your sales game today?</p>
            </div>

            <button
              type="button"
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
                type="button"
                onClick={() => router.push("/history")}
                style={linkButtonStyle}
              >
                View all
              </button>
            </div>

            {loading ? (
              <p style={emptyTextStyle}>Loading recent sessions...</p>
            ) : recentSessions.length === 0 ? (
              <p style={emptyTextStyle}>No practice sessions yet.</p>
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
            <h2 style={titleStyle}>Your Progress</h2>
            <p style={subtitleStyle}>Skill growth overview</p>

            <div style={{ marginTop: "22px", display: "grid", gap: "18px" }}>
              <ProgressRow label="Discovery" score={dimensions?.discovery?.latest} />
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

function AdminOverviewCard({
  icon,
  title,
  rows,
  buttonLabel,
  onClick,
}: {
  icon: string;
  title: string;
  rows: [string, string][];
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div style={adminCardStyle}>
      <div style={adminIconStyle}>{icon}</div>
      <h2 style={adminCardTitleStyle}>{title}</h2>

      <div style={adminRowsStyle}>
        {rows.map(([label, value]) => (
          <div key={label} style={adminRowStyle}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <button type="button" onClick={onClick} style={adminCardButtonStyle}>
        {buttonLabel}
      </button>
    </div>
  );
}

function RecentChange({
  title,
  time,
  description,
}: {
  title: string;
  time: string;
  description: string;
}) {
  return (
    <div style={changeRowStyle}>
      <span style={checkStyle}>✓</span>
      <div>
        <strong>{title}</strong>
        <p style={changeTimeStyle}>{time}</p>
      </div>
      <p style={changeDescriptionStyle}>{description}</p>
    </div>
  );
}

function AdminStatusRow({
  title,
  description,
  status,
  action,
  onClick,
}: {
  title: string;
  description: string;
  status: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div style={adminStatusRowStyle}>
      <div>
        <strong style={adminStatusTitleStyle}>{title}</strong>
        <p style={subtitleStyle}>{description}</p>
      </div>

      <div style={adminStatusRightStyle}>
        <span style={adminStatusBadgeStyle}>{status}</span>

        <button type="button" onClick={onClick} style={adminMiniButtonStyle}>
          {action}
        </button>
      </div>
    </div>
  );
}
function ManagerDashboard({
  fullName,
  onViewTeam,
}: {
  fullName: string;
  onViewTeam: () => void;
}) {
  const sessionsTrend = [
    { day: "Mon", sessions: 8 },
    { day: "Tue", sessions: 12 },
    { day: "Wed", sessions: 15 },
    { day: "Thu", sessions: 10 },
    { day: "Fri", sessions: 18 },
    { day: "Sat", sessions: 6 },
    { day: "Sun", sessions: 8 },
  ];

  const skillData = [
    { name: "Rapport", value: 72 },
    { name: "Discovery", value: 68 },
    { name: "Objections", value: 61 },
    { name: "Closing", value: 55 },
  ];

  const coachingData = [
    { name: "ABC", skill: "Closing", score: 48 },
    { name: "Nidhi", skill: "Discovery", score: 58 },
    { name: "Fortuna", skill: "Objections", score: 64 },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <div style={heroInnerStyle}>
            <div>
              <p style={eyebrowStyle}>AI Manager Dashboard</p>
              <h1 style={heroTitleStyle}>Good Morning, {fullName} 👋</h1>
              <p style={heroSubtitleStyle}>
                Track team performance, coaching priorities, and sales practice progress.
              </p>
            </div>

            <button type="button" onClick={onViewTeam} style={primaryButtonStyle}>
              View Team →
            </button>
          </div>
        </section>

        <div style={statsGridStyle}>
          <ManagerKpi title="Team Score" value="72%" trend="+6%" icon="⭐" />
          <ManagerKpi title="Sessions" value="77" trend="+14 this week" icon="🎙️" />
          <ManagerKpi title="Active Reps" value="9" trend="90% active" icon="👥" />
          <ManagerKpi title="Need Coaching" value="3" trend="Priority reps" icon="🚩" />
        </div>

        <div style={managerChartGridStyle}>
          <section style={panelStyle}>
            <h2 style={titleStyle}>Sessions Trend</h2>
            <p style={subtitleStyle}>Practice activity this week</p>

            <div style={chartBoxStyle}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionsTrend}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#006b4f"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={titleStyle}>Skill Distribution</h2>
            <p style={subtitleStyle}>Average score by skill area</p>

            <div style={chartBoxStyle}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={skillData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {skillData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={["#006b4f", "#00a36c", "#f59e0b", "#ef4444"][index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div style={managerChartGridStyle}>
          <section style={panelStyle}>
            <h2 style={titleStyle}>Team Performance</h2>
            <p style={subtitleStyle}>Skill strengths and weak areas</p>

            <div style={chartBoxStyle}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#006b4f" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={titleStyle}>Coaching Priority</h2>
            <p style={subtitleStyle}>Reps who need manager attention</p>

            <div style={{ display: "grid", gap: "14px", marginTop: "22px" }}>
              {coachingData.map((rep) => (
                <div key={rep.name} style={priorityCardStyle}>
                  <div>
                    <strong>{rep.name}</strong>
                    <p style={subtitleStyle}>Weakest skill: {rep.skill}</p>
                  </div>

                  <span style={priorityBadgeStyle}>{rep.score}%</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
function AdminCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div style={managerKpiStyle}>
      <div style={managerKpiIconStyle}>{icon}</div>
      <p style={summaryLabelStyle}>{title}</p>
      <strong style={summaryNumberStyle}>{value}</strong>
    </div>
  );
}
function ManagerKpi({
  title,
  value,
  trend,
  icon,
}: {
  title: string;
  value: string;
  trend: string;
  icon: string;
}) {
  return (
    <div style={managerKpiStyle}>
      <div style={managerKpiIconStyle}>{icon}</div>
      <p style={summaryLabelStyle}>{title}</p>
      <strong style={summaryNumberStyle}>{value}</strong>
      <span style={summaryTrendStyle}>{trend}</span>
    </div>
  );
}

function ProgressRow({
  label,
  score,
}: {
  label: string;
  score: number | null | undefined;
}) {
  const hasScore = score != null;
  const safeScore = hasScore ? score : 0;
  const percentage = hasScore ? Math.min(safeScore * 10, 100) : 0;

  return (
    <div>
      <div style={progressHeaderStyle}>
        <span>{label}</span>
        <span>{hasScore ? `${safeScore.toFixed(1)}/10` : "--"}</span>
      </div>

      <div style={progressBgStyle}>
        <div style={{ ...progressFillStyle, width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function formatScenario(value: string) {
  return value
    .replace(/_/g, " ")
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

const emptyTextStyle: React.CSSProperties = {
  color: "#667085",
  marginTop: "20px",
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

const managerChartGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
  marginBottom: "28px",
};

const chartBoxStyle: React.CSSProperties = {
  width: "100%",
  height: "280px",
  marginTop: "24px",
};

const managerKpiStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
};

const managerKpiIconStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "16px",
  background: "#e7f4ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  marginBottom: "14px",
};

const summaryLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#667085",
  fontWeight: 700,
};

const summaryNumberStyle: React.CSSProperties = {
  display: "block",
  marginTop: "8px",
  fontSize: "34px",
  color: "#006b4f",
  fontWeight: 900,
};

const summaryTrendStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: "8px",
  color: "#027a48",
  fontWeight: 700,
};

const priorityBadgeStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#b91c1c",
  fontWeight: 900,
};



const adminStatusRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "center",
  padding: "20px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  background: "#f8fbf9",
};

const adminStatusTitleStyle: React.CSSProperties = {
  fontSize: "17px",
  color: "#101828",
};

const adminStatusRightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const adminStatusBadgeStyle: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#ecfdf3",
  color: "#027a48",
  fontWeight: 800,
  fontSize: "13px",
};

const adminMiniButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "none",
  background: "#00704f",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const adminPageStyle: React.CSSProperties = {
  maxWidth: "1280px",
  margin: "0 auto",
};

const adminHeaderStyle: React.CSSProperties = {
  marginBottom: "28px",
};

const adminTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "42px",
  fontWeight: 900,
  color: "#101828",
};

const adminSubtitleStyle: React.CSSProperties = {
  marginTop: "10px",
  color: "#667085",
  fontSize: "17px",
};

const adminCardsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "22px",
  marginBottom: "24px",
};

const adminCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 18px 45px rgba(16, 24, 40, 0.07)",
};

const adminIconStyle: React.CSSProperties = {
  width: "58px",
  height: "58px",
  borderRadius: "20px",
  background: "#e7f4ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  marginBottom: "20px",
};

const adminCardTitleStyle: React.CSSProperties = {
  margin: "0 0 18px",
  fontSize: "22px",
  fontWeight: 900,
  color: "#101828",
};

const adminRowsStyle: React.CSSProperties = {
  display: "grid",
  gap: "14px",
  paddingBottom: "22px",
  borderBottom: "1px solid #e5e7eb",
};

const adminRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: "#344054",
};

const adminCardButtonStyle: React.CSSProperties = {
  marginTop: "18px",
  float: "right",
  padding: "12px 22px",
  borderRadius: "12px",
  border: "none",
  background: "#00704f",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
};

const adminPanelStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "28px",
  marginBottom: "24px",
  boxShadow: "0 18px 45px rgba(16, 24, 40, 0.06)",
};

const adminSectionTitleStyle: React.CSSProperties = {
  margin: "0 0 24px",
  fontSize: "24px",
  fontWeight: 900,
  color: "#101828",
};


const timelineStyle: React.CSSProperties = {
  display: "grid",
  gap: "18px",
};

const changeRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "32px 260px 1fr",
  gap: "16px",
  alignItems: "center",
};

const checkStyle: React.CSSProperties = {
  width: "26px",
  height: "26px",
  borderRadius: "999px",
  background: "#00704f",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
};

const changeTimeStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#667085",
};

const changeDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#475467",
};

const priorityCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "#f8fbf9",
  borderRadius: "20px",
  padding: "22px",
  textAlign: "left",
  cursor: "pointer",
  display: "grid",
  gap: "10px",
  color: "#101828",
};