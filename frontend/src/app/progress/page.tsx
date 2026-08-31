"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";

import AppShell from "../../components/AppShell";
import { API_BASE_URL, authFetch } from "../../lib/api";

type MetricScores = {
  rapport?: number;
  discovery?: number;
  needs_discovery?: number;
  objection_handling?: number;
  closing?: number;
};

type ProfileVersion = {
  version: number;
  metric_scores: MetricScores;
  weakest_dimension: string | null;
  created_at: string | null;
};

type ProfileHistoryResponse = {
  profiles: ProfileVersion[];
};

type ChartPoint = {
  version: number;
  rapport: number | null;
  discovery: number | null;
  objection_handling: number | null;
  closing: number | null;
};

type DimensionKey = "rapport" | "discovery" | "objection_handling" | "closing";

export default function ProgressPage() {
  const t = useTranslations("Progress");
  const locale = useLocale();
  const [profiles, setProfiles] = useState<ProfileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllHistory, setShowAllHistory] = useState(false);

  const dimensionLabels: Record<DimensionKey, string> = {
    rapport: t("dimensions.rapport"),
    discovery: t("dimensions.discovery"),
    objection_handling: t("dimensions.objectionHandling"),
    closing: t("dimensions.closing"),
  };

  useEffect(() => {
    async function loadProfileHistory() {
      try {
        const response = await authFetch(`${API_BASE_URL}/profile/me/history`);

        if (!response.ok) {
          throw new Error(t("error"));
        }

        const data = (await response.json()) as ProfileHistoryResponse;
        setProfiles(data.profiles ?? []);
      } catch (progressError) {
        console.error(progressError);
        setError(
          progressError instanceof Error
            ? progressError.message
            : t("error")
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfileHistory();
  }, [t]);

  const chartData = useMemo<ChartPoint[]>(() => {
    return profiles.map((profile) => ({
      version: profile.version,
      rapport: getMetric(profile.metric_scores, "rapport"),
      discovery: getMetric(profile.metric_scores, "discovery"),
      objection_handling: getMetric(profile.metric_scores, "objection_handling"),
      closing: getMetric(profile.metric_scores, "closing"),
    }));
  }, [profiles]);

  const latestProfile = profiles[profiles.length - 1];

  return (
    <AppShell>
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>{t("eyebrow")}</p>
            <h1 style={titleStyle}>{t("title")}</h1>
            <p style={subtitleStyle}>{t("subtitle")}</p>
          </div>

          {!loading && !error && profiles.length > 0 && (
            <div style={heroStatsStyle}>
              <div style={heroStatStyle}>
                <span>{t("stats.currentFocus")}</span>
                <strong>
                  {formatDimension(
                    latestProfile?.weakest_dimension,
                    dimensionLabels,
                    t("notAvailable")
                  )}
                </strong>
              </div>

              <div style={heroStatStyle}>
                <span>{t("stats.bestSkill")}</span>
                <strong>
                  {getBestSkill(latestProfile, dimensionLabels, t("notAvailable"))}
                </strong>
              </div>

              <div style={heroStatStyle}>
                <span>{t("stats.versions")}</span>
                <strong>{profiles.length}</strong>
              </div>
            </div>
          )}
        </section>

        {loading ? (
          <section style={panelStyle}>
            <p style={mutedTextStyle}>{t("loading")}</p>
          </section>
        ) : error ? (
          <section style={errorPanelStyle}>{error}</section>
        ) : profiles.length === 0 ? (
          <section style={panelStyle}>
            <div style={{ fontSize: "46px", marginBottom: "14px" }}>📈</div>
            <h2 style={sectionTitleStyle}>{t("empty.title")}</h2>
            <p style={mutedTextStyle}>{t("empty.description")}</p>
          </section>
        ) : (
          <>
            

            <section style={panelStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>{t("chart.title")}</h2>
                  <p style={mutedTextStyle}>{t("chart.subtitle")}</p>
                </div>
              </div>

              <div style={largeChartBoxStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="version"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [
                        `${value}/10`,
                        formatDimension(
                          String(name),
                          dimensionLabels,
                          t("notAvailable")
                        ),
                      ]}
                      labelFormatter={(value) =>
                        t("history.profileVersion", { version: String(value) })
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rapport"
                      name={dimensionLabels.rapport}
                      stroke="#00704f"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="discovery"
                      name={dimensionLabels.discovery}
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="objection_handling"
                      name={dimensionLabels.objection_handling}
                      stroke="#9333ea"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="closing"
                      name={dimensionLabels.closing}
                      stroke="#ea580c"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={panelStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>{t("history.title")}</h2>
                  <p style={mutedTextStyle}>{t("history.subtitle")}</p>
                </div>
              </div>

              <div style={historyListStyle}>
                {[...profiles]
                  .reverse()
                  .slice(0, showAllHistory ? profiles.length : 5)
                  .map((profile) => (
                    <div key={profile.version} style={historyRowStyle}>
                      <div>
                        <strong>
                          {t("history.profileVersion", {
                            version: profile.version,
                          })}
                        </strong>
                        <p style={mutedTextStyle}>
                          {profile.created_at
                            ? formatDate(profile.created_at, locale)
                            : t("history.noDate")}
                        </p>
                      </div>

                      <span style={focusBadgeStyle}>
                        {t("history.focus", {
                          dimension: formatDimension(
                            profile.weakest_dimension,
                            dimensionLabels,
                            t("notAvailable")
                          ),
                        })}
                      </span>
                    </div>
                  ))}
              </div>
              {profiles.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllHistory((current) => !current)}
                  style={viewAllButtonStyle}
                >
                  {showAllHistory ? t("history.showLess") : t("history.viewAll")}
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={overviewItemStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getMetric(scores: MetricScores, key: DimensionKey) {
  if (key === "discovery") {
    return scores.discovery ?? scores.needs_discovery ?? null;
  }

  return scores[key] ?? null;
}

function getBestSkill(
  profile: ProfileVersion | undefined,
  dimensionLabels: Record<DimensionKey, string>,
  fallback: string
) {
  if (!profile) return fallback;

  const scores: [DimensionKey, number | null][] = [
    ["rapport", getMetric(profile.metric_scores, "rapport")],
    ["discovery", getMetric(profile.metric_scores, "discovery")],
    ["objection_handling", getMetric(profile.metric_scores, "objection_handling")],
    ["closing", getMetric(profile.metric_scores, "closing")],
  ];

  const valid = scores.filter(
    ([, value]) => typeof value === "number"
  ) as [DimensionKey, number][];

  if (valid.length === 0) return fallback;

  return dimensionLabels[valid.sort((a, b) => b[1] - a[1])[0][0]];
}

function formatDimension(
  value: string | null | undefined,
  dimensionLabels: Record<DimensionKey, string>,
  fallback: string
) {
  const normalized = value
    ?.replace("_score", "")
    .replace("needs_discovery", "discovery") as DimensionKey | undefined;

  if (!normalized) return fallback;

  return dimensionLabels[normalized] ?? fallback;
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale === "sv" ? "sv-SE" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const pageStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
  border: "1px solid #dfeee8",
  borderRadius: "28px",
  padding: "34px",
  boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
  marginBottom: "24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "28px",
};

const heroStatsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "12px",
  minWidth: "420px",
};

const heroStatStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.78)",
  border: "1px solid #dfeee8",
  borderRadius: "18px",
  padding: "16px",
  display: "grid",
  gap: "6px",
  color: "#667085",
  fontWeight: 700,
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
  padding: "32px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
  marginBottom: "24px",
};

const overviewPanelStyle: React.CSSProperties = {
  ...panelStyle,
  display: "grid",
  gridTemplateColumns: "280px 1fr",
  gap: "28px",
  alignItems: "center",
};

const overviewGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "14px",
};

const overviewItemStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "#f8fbf9",
  border: "1px solid #e5e7eb",
  display: "grid",
  gap: "8px",
  color: "#667085",
  fontWeight: 700,
};

const errorPanelStyle: React.CSSProperties = {
  ...panelStyle,
  color: "#b42318",
  background: "#fef3f2",
  border: "1px solid #fecdca",
  fontWeight: 700,
};

const mutedTextStyle: React.CSSProperties = {
  color: "#667085",
  lineHeight: 1.7,
  margin: "6px 0 0",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "flex-start",
  marginBottom: "24px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#101828",
  fontSize: "24px",
  fontWeight: 900,
};

const largeChartBoxStyle: React.CSSProperties = {
  height: "390px",
  marginTop: "18px",
};

const historyListStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const historyRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
};

const focusBadgeStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#e7f4ef",
  color: "#00704f",
  fontWeight: 800,
  fontSize: "13px",
};

const viewAllButtonStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "12px 18px",
  borderRadius: "14px",
  border: "1px solid #00704f",
  background: "#ffffff",
  color: "#00704f",
  fontWeight: 800,
  cursor: "pointer",
};
