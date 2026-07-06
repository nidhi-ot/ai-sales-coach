"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authFetch, API_BASE_URL } from "../../lib/api";
import AppShell from "../../components/AppShell";

type TeamMember = {
  rep_id: string;
  name: string;
  sessions: number;
  last_practice: string | null;
  average_score: number | null;
  weakest_dimension: string | null;
};

type ProgressMetric = {
  average: number | null;
  count: number;
};

type TeamProgress = {
  rapport?: ProgressMetric;
  discovery?: ProgressMetric;
  objection_handling?: ProgressMetric;
  closing?: ProgressMetric;
};

type RawRep = {
  id: string;
  full_name?: string | null;
  phone_number?: string | null;
  sessions?: number;
  last_practice?: string | null;
  average_score?: number | null;
  weakest_dimension?: string | null;
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [progress, setProgress] = useState<TeamProgress>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadManagerData() {
      try {
        const businessId = window.localStorage.getItem("business_id");

        if (!businessId) {
          throw new Error("Missing business_id in localStorage");
        }

        const [teamRes, progressRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/manager/business/${businessId}/team`),
          authFetch(`${API_BASE_URL}/manager/team/progress`),
        ]);

        const teamData = await teamRes.json();
        const progressData = await progressRes.json();

        const rawReps: RawRep[] = Array.isArray(teamData.reps)
          ? teamData.reps
          : [];

        const normalizedTeam: TeamMember[] = rawReps.map((rep) => ({
          rep_id: rep.id,
          name: rep.full_name ?? rep.phone_number ?? "Unknown Rep",
          sessions: rep.sessions ?? 0,
          last_practice: rep.last_practice ?? null,
          average_score: rep.average_score ?? null,
          weakest_dimension: rep.weakest_dimension ?? null,
        }));

        setTeam(normalizedTeam);
        setProgress(progressData.progress ?? {});
      } catch (error) {
        console.error("Failed to load manager data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadManagerData();
  }, []);

  const summary = useMemo(() => {
    const totalReps = team.length;
    const totalSessions = team.reduce((sum, rep) => sum + rep.sessions, 0);

    const validScores = team
      .map((rep) => rep.average_score)
      .filter((score): score is number => typeof score === "number");

    const avgScore =
      validScores.length > 0
        ? Number(
            (
              validScores.reduce((sum, score) => sum + score, 0) /
              validScores.length
            ).toFixed(1)
          )
        : 0;

    const activeThisWeek = team.filter((rep) =>
      Boolean(rep.last_practice)
    ).length;

    return { totalReps, totalSessions, avgScore, activeThisWeek };
  }, [team]);

  const topPerformer = useMemo(() => {
    return team
      .filter((rep) => rep.average_score !== null)
      .sort((a, b) => (b.average_score ?? 0) - (a.average_score ?? 0))[0];
  }, [team]);

  const needsAttention = useMemo(() => {
    return team
      .filter((rep) => rep.average_score !== null)
      .sort((a, b) => (a.average_score ?? 0) - (b.average_score ?? 0))[0];
  }, [team]);

  if (loading) {
    return (
      <AppShell>
        <main style={pageStyle}>
          <div style={containerStyle}>
            <h1 style={titleStyle}>Manager Dashboard</h1>
            <p style={subtitleStyle}>Loading team performance...</p>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main style={pageStyle}>
        <section style={containerStyle}>
          <div style={headerStyle}>
            <p style={eyebrowStyle}>Manager View</p>
            <h1 style={titleStyle}>Team Dashboard</h1>
            <p style={subtitleStyle}>
              Monitor team practice, scorecards, progress, and coaching
              opportunities.
            </p>
          </div>

          <section style={summaryGridStyle}>
            <SummaryCard title="Total Reps" value={summary.totalReps.toString()} />
            <SummaryCard
              title="Total Sessions"
              value={summary.totalSessions.toString()}
            />
            <SummaryCard title="Average Score" value={`${summary.avgScore}/10`} />
            <SummaryCard
              title="Active This Week"
              value={summary.activeThisWeek.toString()}
            />
          </section>

          <p style={updatedNoteStyle}>
            Updated from latest scorecards and practice sessions.
          </p>

          <section style={highlightGridStyle}>
            <div style={highlightCardStyle}>
              <p style={highlightLabelStyle}>🏆 Top Performer</p>
              <h3 style={highlightTitleStyle}>
                {topPerformer?.name ?? "No data yet"}
              </h3>
              <p style={highlightTextStyle}>
                {topPerformer
                  ? `${topPerformer.sessions} sessions • ${topPerformer.average_score}/10 avg score`
                  : "No scorecards available yet"}
              </p>
            </div>

            <div style={highlightCardStyle}>
              <p style={highlightLabelStyle}>⚠ Needs Attention</p>
              <h3 style={highlightTitleStyle}>
                {needsAttention?.name ?? "No urgent issue"}
              </h3>
              <p style={highlightTextStyle}>
                {needsAttention
                  ? `Focus on ${needsAttention.weakest_dimension ?? "recent sessions"}`
                  : "Everyone is doing okay"}
              </p>
            </div>
          </section>

          <section style={layoutStyle}>
            <div style={mainColumnStyle}>
              <section style={cardStyle}>
                <h2 style={cardTitleStyle}>Team Performance</h2>
                <p style={cardSubtitleStyle}>
                  View each rep&apos;s usage, average score, and weakest skill.
                </p>

                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <Th>Rep</Th>
                        <Th>Sessions</Th>
                        <Th>Last Practice</Th>
                        <Th>Avg Score</Th>
                        <Th>Weakest Skill</Th>
                        <Th>Status</Th>
                        <Th>Action</Th>
                      </tr>
                    </thead>

                    <tbody>
                      {team.map((rep) => (
                        <tr key={rep.rep_id}>
                          <Td>
                            <strong>{rep.name}</strong>
                          </Td>
                          <Td>{rep.sessions}</Td>
                          <Td>{formatDateTime(rep.last_practice)}</Td>
                          <Td>
                            <ScoreBadge score={rep.average_score} />
                          </Td>
                          <Td>{rep.weakest_dimension ?? "Not enough data"}</Td>
                          <Td>
                            <StatusBadge score={rep.average_score} />
                          </Td>
                          <Td>
                            <Link
                              href={`/team/reps/${rep.rep_id}`}
                              style={viewButtonStyle}
                            >
                              View Details
                            </Link>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside style={sideColumnStyle}>
              <section style={cardStyle}>
                <h2 style={cardTitleStyle}>Skill Health</h2>
                <ProgressRow label="Rapport" value={progress.rapport?.average ?? 0} />
                <ProgressRow
                  label="Discovery"
                  value={progress.discovery?.average ?? 0}
                />
                <ProgressRow
                  label="Objection Handling"
                  value={progress.objection_handling?.average ?? 0}
                />
                <ProgressRow label="Closing" value={progress.closing?.average ?? 0} />
              </section>

              <section style={cardStyle}>
                <h2 style={cardTitleStyle}>Coaching Priority</h2>

                {team.filter((rep) => (rep.average_score ?? 100) < 7.5).length ===
                0 ? (
                  <p style={mutedStyle}>No urgent coaching needs right now.</p>
                ) : (
                  team
                    .filter((rep) => (rep.average_score ?? 100) < 7.5)
                    .slice(0, 4)
                    .map((rep) => (
                      <div key={rep.rep_id} style={attentionCardStyle}>
                        <strong>{rep.name}</strong>

                        <div style={attentionMetaStyle}>
                          <span>Weak Skill</span>
                          <b>{rep.weakest_dimension ?? "Review sessions"}</b>
                        </div>

                        <div style={attentionMetaStyle}>
                          <span>Average Score</span>
                          <b>
                            {rep.average_score !== null
                              ? `${rep.average_score}/10`
                              : "N/A"}
                          </b>
                        </div>

                        <p style={mutedStyle}>{rep.sessions} practice sessions</p>
                      </div>
                    ))
                )}
              </section>
            </aside>
          </section>
        </section>
      </main>
    </AppShell>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={summaryCardStyle}>
      <p style={summaryTitleStyle}>{title}</p>
      <strong style={summaryValueStyle}>{value}</strong>
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: number | null }) {
  const safeValue = value ?? 0;
  const percentage = Math.min(safeValue * 10, 100);

  return (
    <div style={progressRowStyle}>
      <div style={progressTopStyle}>
        <span>{label}</span>
        <strong>{safeValue.toFixed(2)}/10</strong>
      </div>

      <div style={progressTrackStyle}>
        <div style={{ ...progressFillStyle, width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span style={neutralBadgeStyle}>N/A</span>;
  }

  if (score >= 8) return <span style={successBadgeStyle}>{score.toFixed(1)}/10</span>;
  if (score >= 6) return <span style={goodBadgeStyle}>{score.toFixed(1)}/10</span>;
  if (score >= 3) return <span style={warningBadgeStyle}>{score.toFixed(1)}/10</span>;

  return <span style={dangerBadgeStyle}>{score.toFixed(1)}/10</span>;
}

function StatusBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span style={neutralBadgeStyle}>New Rep</span>;
  }

  if (score >= 8) return <span style={successBadgeStyle}>Performing well</span>;
  if (score >= 6) return <span style={goodBadgeStyle}>Improving</span>;

  return <span style={dangerBadgeStyle}>Needs coaching</span>;
}

function Th({ children }: { children: ReactNode }) {
  return <th style={thStyle}>{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td style={tdStyle}>{children}</td>;
}

function formatDateTime(value: string | null) {
  if (!value) return "No sessions";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fbf9 0%, #eef7f2 100%)",
  padding: "40px",
  color: "#101828",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const containerStyle = { maxWidth: "1500px", margin: "0 auto" };
const headerStyle = { marginBottom: "32px" };
const eyebrowStyle = {
  margin: 0,
  color: "#00704f",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};
const titleStyle = { margin: "8px 0", fontSize: "44px", fontWeight: 950 };
const subtitleStyle = {
  margin: 0,
  color: "#667085",
  fontSize: "18px",
  lineHeight: 1.6,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
  marginBottom: "28px",
};
const summaryCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "26px",
  boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
};
const summaryTitleStyle = { margin: 0, color: "#667085", fontWeight: 700 };
const summaryValueStyle = {
  display: "block",
  marginTop: "12px",
  fontSize: "36px",
  color: "#00704f",
};

const updatedNoteStyle = {
  marginTop: "-10px",
  marginBottom: "24px",
  color: "#667085",
  fontSize: "14px",
  fontStyle: "italic",
};

const highlightGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: "24px",
};
const highlightCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
};
const highlightLabelStyle = {
  margin: 0,
  color: "#00704f",
  fontWeight: 900,
  fontSize: "14px",
};
const highlightTitleStyle = { margin: "10px 0 6px", fontSize: "24px" };
const highlightTextStyle = { margin: 0, color: "#667085" };

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 380px",
  gap: "28px",
};
const mainColumnStyle = { display: "grid", gap: "24px" };
const sideColumnStyle = { display: "grid", gap: "24px", alignSelf: "start" };

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 20px 60px rgba(15,23,42,0.06)",
};
const cardTitleStyle = { margin: 0, fontSize: "24px", fontWeight: 900 };
const cardSubtitleStyle = { margin: "6px 0 20px", color: "#667085" };

const tableWrapStyle = { overflowX: "auto" as const };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const };
const thStyle = {
  textAlign: "left" as const,
  padding: "14px",
  color: "#667085",
  fontSize: "14px",
  borderBottom: "1px solid #e5e7eb",
};
const tdStyle = {
  padding: "16px 14px",
  borderBottom: "1px solid #eef2f7",
  verticalAlign: "middle" as const,
};

const neutralBadgeStyle = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#f2f4f7",
  color: "#667085",
  fontWeight: 800,
};
const successBadgeStyle = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#dff5ea",
  color: "#00704f",
  fontWeight: 800,
};
const goodBadgeStyle = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#fef3c7",
  color: "#92400e",
  fontWeight: 800,
};
const warningBadgeStyle = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#fff7ed",
  color: "#c2410c",
  fontWeight: 800,
};
const dangerBadgeStyle = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#b91c1c",
  fontWeight: 800,
};

const viewButtonStyle = {
  display: "inline-flex",
  padding: "10px 14px",
  borderRadius: "12px",
  background: "#00704f",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: "14px",
};
const mutedStyle = { margin: "4px 0 0", color: "#667085", lineHeight: 1.5 };

const progressRowStyle = {
  padding: "16px 0",
  borderTop: "1px solid #eef2f7",
};
const progressTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  fontWeight: 800,
};
const progressTrackStyle = {
  height: "10px",
  borderRadius: "999px",
  background: "#eef2f7",
  overflow: "hidden",
};
const progressFillStyle = {
  height: "100%",
  borderRadius: "999px",
  background: "#00704f",
};

const attentionCardStyle = {
  padding: "16px",
  borderRadius: "18px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  marginTop: "14px",
};
const attentionMetaStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "10px",
  color: "#667085",
  fontSize: "13px",
};