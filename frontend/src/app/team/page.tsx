"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
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

type Translate = ReturnType<typeof useTranslations>;

export default function TeamPage() {
  const t = useTranslations("Team");
  const locale = useLocale();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [progress, setProgress] = useState<TeamProgress>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
  async function loadManagerData() {
    try {
      const businessId = window.localStorage.getItem("business_id");

      if (!businessId) {
        console.error("Missing business_id in localStorage");
        window.location.replace("/login");
        return;
      }

      const storedBusinessId = window.localStorage.getItem("business_id");

if (!storedBusinessId) {
  window.location.replace("/login");
  return;
}

setBusinessId(storedBusinessId);

      const [teamRes, progressRes] = await Promise.all([
      authFetch(`${API_BASE_URL}/manager/business/${businessId}/team`),
      authFetch(`${API_BASE_URL}/manager/business/${businessId}/progress`),
      ]);

      if (!teamRes.ok) {
        throw new Error(
        `Failed to load team (${teamRes.status})`
  );
}

if (!progressRes.ok) {
  throw new Error(
    `Failed to load team progress (${progressRes.status})`
  );
}

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
    } catch (err) {
  console.error("Failed to load manager data:", err);

  if (err instanceof Error && err.message === "Unauthorized") {
    return;
  }

  setError(
    err instanceof Error
      ? err.message
        : t("errors.load")
  );
} finally {
      setLoading(false);
    }
  }

  loadManagerData();
}, [t]);

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
            <h1 style={titleStyle}>{t("managerDashboard")}</h1>
            <p style={subtitleStyle}>{t("loading")}</p>
          </div>
        </main>
      </AppShell>
    );
  }
if (error) {
  return (
    <AppShell>
      <main style={pageStyle}>
        <div style={containerStyle}>
          <h1 style={titleStyle}>{t("title")}</h1>

          <div
            style={{
              marginTop: "24px",
              padding: "20px",
              borderRadius: "16px",
              background: "#fef3f2",
              border: "1px solid #fecdca",
              color: "#b42318",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
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
            <p style={eyebrowStyle}>{t("eyebrow")}</p>
            <h1 style={titleStyle}>{t("title")}</h1>
            <p style={subtitleStyle}>
              {t("subtitle")}
            </p>
          </div>

          <section style={summaryGridStyle}>
            <SummaryCard title={t("summary.totalReps")} value={summary.totalReps.toString()} />
            <SummaryCard
              title={t("summary.totalSessions")}
              value={summary.totalSessions.toString()}
            />
            <SummaryCard title={t("summary.averageScore")} value={`${summary.avgScore}/10`} />
            <SummaryCard
              title={t("summary.activeThisWeek")}
              value={summary.activeThisWeek.toString()}
            />
          </section>

          <p style={updatedNoteStyle}>
            {t("updatedNote")}
          </p>

          <section style={highlightGridStyle}>
            <div style={highlightCardStyle}>
              <p style={highlightLabelStyle}>{t("highlights.topPerformer")}</p>
              <h3 style={highlightTitleStyle}>
                {topPerformer?.name ?? t("fallbacks.noData")}
              </h3>
              <p style={highlightTextStyle}>
                {topPerformer
                  ? t("highlights.topPerformerMeta", {
                      sessions: topPerformer.sessions,
                      score: topPerformer.average_score ?? 0,
                    })
                  : t("fallbacks.noScorecards")}
              </p>
            </div>

            <div style={highlightCardStyle}>
              <p style={highlightLabelStyle}>{t("highlights.needsAttention")}</p>
              <h3 style={highlightTitleStyle}>
                {needsAttention?.name ?? t("fallbacks.noUrgentIssue")}
              </h3>
              <p style={highlightTextStyle}>
                {needsAttention
                  ? t("highlights.needsAttentionMeta", {
                      dimension: formatDimension(
                        needsAttention.weakest_dimension,
                        t
                      ),
                    })
                  : t("fallbacks.everyoneOkay")}
              </p>
            </div>
          </section>

          <section style={layoutStyle}>
            <div style={mainColumnStyle}>
              <section style={cardStyle}>
                <h2 style={cardTitleStyle}>{t("performance.title")}</h2>
                <p style={cardSubtitleStyle}>
                  {t("performance.subtitle")}
                </p>

                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <Th>{t("table.rep")}</Th>
                        <Th>{t("table.sessions")}</Th>
                        <Th>{t("table.lastPractice")}</Th>
                        <Th>{t("table.avgScore")}</Th>
                        <Th>{t("table.weakestSkill")}</Th>
                        <Th>{t("table.status")}</Th>
                        <Th>{t("table.action")}</Th>
                      </tr>
                    </thead>

                    <tbody>
                      {team.map((rep) => (
                        <tr key={rep.rep_id}>
                          <Td>
                            <strong>{rep.name}</strong>
                          </Td>
                          <Td>{rep.sessions}</Td>
                          <Td>{formatDateTime(rep.last_practice, locale, t("fallbacks.noSessions"))}</Td>
                          <Td>
                            <ScoreBadge score={rep.average_score} />
                          </Td>
                          <Td>
                            {formatDimension(
                              rep.weakest_dimension,
                              t,
                              t("fallbacks.notEnoughData")
                            )}
                          </Td>
                          <Td>
                            <StatusBadge score={rep.average_score} />
                          </Td>
                          <Td>
                            <Link
                              href={`/team/reps/${rep.rep_id}?business_id=${businessId}`}
                              style={viewButtonStyle}
                            >
                              {t("table.viewDetails")}
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
                <h2 style={cardTitleStyle}>{t("skillHealth.title")}</h2>
                <ProgressRow label={t("dimensions.rapport")} value={progress.rapport?.average ?? 0} />
                <ProgressRow
                  label={t("dimensions.discovery")}
                  value={progress.discovery?.average ?? 0}
                />
                <ProgressRow
                  label={t("dimensions.objectionHandling")}
                  value={progress.objection_handling?.average ?? 0}
                />
                <ProgressRow label={t("dimensions.closing")} value={progress.closing?.average ?? 0} />
              </section>

              <section style={cardStyle}>
                <h2 style={cardTitleStyle}>{t("coachingPriority.title")}</h2>

                {team.filter((rep) => (rep.average_score ?? 100) < 7.5).length ===
                0 ? (
                  <p style={mutedStyle}>{t("coachingPriority.empty")}</p>
                ) : (
                  team
                    .filter((rep) => (rep.average_score ?? 100) < 7.5)
                    .slice(0, 4)
                    .map((rep) => (
                      <div key={rep.rep_id} style={attentionCardStyle}>
                        <strong>{rep.name}</strong>

                        <div style={attentionMetaStyle}>
                          <span>{t("coachingPriority.weakSkill")}</span>
                          <b>
                            {formatDimension(
                              rep.weakest_dimension,
                              t,
                              t("fallbacks.reviewSessions")
                            )}
                          </b>
                        </div>

                        <div style={attentionMetaStyle}>
                          <span>{t("coachingPriority.averageScore")}</span>
                          <b>
                            {rep.average_score !== null
                              ? `${rep.average_score}/10`
                              : t("fallbacks.notAvailable")}
                          </b>
                        </div>

                        <p style={mutedStyle}>
                          {t("coachingPriority.practiceSessions", {
                            sessions: rep.sessions,
                          })}
                        </p>
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
  const t = useTranslations("Team");

  if (score === null || score === undefined) {
    return <span style={neutralBadgeStyle}>{t("fallbacks.notAvailable")}</span>;
  }

  if (score >= 8) return <span style={successBadgeStyle}>{score.toFixed(1)}/10</span>;
  if (score >= 6) return <span style={goodBadgeStyle}>{score.toFixed(1)}/10</span>;
  if (score >= 3) return <span style={warningBadgeStyle}>{score.toFixed(1)}/10</span>;

  return <span style={dangerBadgeStyle}>{score.toFixed(1)}/10</span>;
}

function StatusBadge({ score }: { score: number | null }) {
  const t = useTranslations("Team");

  if (score === null || score === undefined) {
    return <span style={neutralBadgeStyle}>{t("status.newRep")}</span>;
  }

  if (score >= 8) return <span style={successBadgeStyle}>{t("status.performingWell")}</span>;
  if (score >= 6) return <span style={goodBadgeStyle}>{t("status.improving")}</span>;

  return <span style={dangerBadgeStyle}>{t("status.needsCoaching")}</span>;
}

function Th({ children }: { children: ReactNode }) {
  return <th style={thStyle}>{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td style={tdStyle}>{children}</td>;
}

function formatDateTime(value: string | null, locale: string, emptyLabel: string) {
  if (!value) return emptyLabel;

  return new Date(value).toLocaleString(locale === "sv" ? "sv-SE" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDimension(
  value: string | null,
  t: Translate,
  fallback = t("fallbacks.recentSessions")
) {
  if (!value) return fallback;

  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const key = dimensionTranslationKeys[normalized];

  if (key) {
    return t(`dimensions.${key}`);
  }

  return value.replace(/_/g, " ");
}

const dimensionTranslationKeys: Record<string, string> = {
  rapport: "rapport",
  rapport_score: "rapport",
  discovery: "discovery",
  needs_discovery: "discovery",
  needs_discovery_score: "discovery",
  objection_handling: "objectionHandling",
  objection_handling_score: "objectionHandling",
  closing: "closing",
  closing_score: "closing",
};

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
