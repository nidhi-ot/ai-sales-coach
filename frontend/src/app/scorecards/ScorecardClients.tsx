"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import AppShell from "../../components/AppShell";
import { API_BASE_URL, authFetch } from "../../lib/api";
import {
  frameworkMetrics as buildFrameworkMetrics,
  type FrameworkScores,
} from "../../lib/frameworkScores";

type Scorecard = {
  session_id: string;
  call_duration_seconds?: number | null;
  rep_talk_percentage?: number | null;
  interruptions_count?: number | null;
  filler_words_count?: number | null;
  rapport_score?: number | null;
  needs_discovery_score?: number | null;
  objection_handling_score?: number | null;
  closing_score?: number | null;
  overall_score?: number | null;
  framework_scores?: FrameworkScores | null;
  strengths?: string[] | null;
  improvement_areas?: string[] | null;
  feedback_summary?: string | null;
  shared_with_manager?: boolean | null;
  status?: "processing" | "generated" | "failed" | null;
};

type ScoreMetric = {
  key: string;
  label: string;
  value: number | null | undefined;
  icon: string;
  warning?: boolean;
};

type RecentSession = {
  id: string;
};

const scoreMetrics = (scorecard: Scorecard): ScoreMetric[] => [
  {
    key: "overall",
    label: "Overall Score",
    value: scorecard.overall_score,
    icon: "⭐",
  },
  {
    key: "rapport",
    label: "Rapport",
    value: scorecard.rapport_score,
    icon: "🤝",
  },
  {
    key: "needs",
    label: "Needs Discovery",
    value: scorecard.needs_discovery_score,
    icon: "🔍",
  },
  {
    key: "objections",
    label: "Objection Handling",
    value: scorecard.objection_handling_score,
    icon: "🛡️",
    warning: true,
  },
  {
    key: "closing",
    label: "Closing",
    value: scorecard.closing_score,
    icon: "🏆",
  },
];

function frameworkIcon(key: string): string {
  const icons: Record<string, string> = {
    budget: "💰",
    authority: "👤",
    need: "🎯",
    timeline: "📅",
    metrics: "📊",
    economic_buyer: "💼",
    decision_criteria: "📋",
    decision_process: "🔄",
    identify_pain: "🔥",
    champion: "🏆",
    situation: "📍",
    problem: "🚧",
    implication: "💥",
    need_payoff: "🚀",
  };

  return icons[key] ?? key.slice(0, 2).toUpperCase();
}

export default function ScorecardsClients() {
  const router = useRouter();
  const t = useTranslations("Scorecard");
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("session_id");

  const [sessionId, setSessionId] = useState<string | null>(querySessionId);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoPractice, setHasNoPractice] = useState(false);
  const [error, setError] = useState("");

  const [pollCount, setPollCount] = useState(0);

  const loadScorecard = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
        setError("");
        setHasNoPractice(false);
        setScorecard(null);
        setPollCount(0);
      }

      try {
        let resolvedSessionId = querySessionId;

        if (!resolvedSessionId) {
          const repId = localStorage.getItem("rep_id");

          if (!repId) {
            router.push("/login");
            return;
          }

          const recentResponse = await authFetch(
            `${API_BASE_URL}/sessions/recent/${repId}?limit=1`
          );

          if (!recentResponse.ok) {
            setError(t("connectionError"));
            return;
          }

          const recentData = await recentResponse.json();
          const latestSession = (
            recentData.sessions as RecentSession[] | undefined
          )?.[0];

          if (!latestSession?.id) {
            setHasNoPractice(true);
            return;
          }

          resolvedSessionId = latestSession.id;
        }

        setSessionId(resolvedSessionId);

        const response = await authFetch(
          `${API_BASE_URL}/scorecards/${resolvedSessionId}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.detail || t("scorecardNotFound"));
          return;
        }

        setScorecard(data);
      } catch (error) {
        console.error("Failed to load scorecard:", error);
        setError(t("connectionError"));
      } finally {
        setLoading(false);
      }
    },
    [querySessionId, router, t]
  );

  useEffect(() => {
    void loadScorecard();
  }, [loadScorecard]);

  useEffect(() => {
    if (!sessionId || scorecard?.status !== "processing" || pollCount >= 24) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPollCount((current) => current + 1);
      void loadScorecard({ silent: true });
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [sessionId, scorecard?.status, pollCount, loadScorecard]);

  const overallScore = scorecard?.overall_score ?? null;
  const frameworkScoreGroup = buildFrameworkMetrics(scorecard?.framework_scores);
  const frameworkScoreMetrics: ScoreMetric[] = frameworkScoreGroup.metrics.map((metric) => ({
    ...metric,
    icon: frameworkIcon(metric.key),
  }));
  const scoreMetricLabels: Record<string, string> = {
    overall: t("scoreMetrics.overall"),
    rapport: t("scoreMetrics.rapport"),
    needs: t("scoreMetrics.needs"),
    objections: t("scoreMetrics.objections"),
    closing: t("scoreMetrics.closing"),
  };

  const frameworkMetricLabels: Record<string, string> = {
    budget: t("frameworkMetrics.budget"),
    authority: t("frameworkMetrics.authority"),
    need: t("frameworkMetrics.need"),
    timeline: t("frameworkMetrics.timeline"),
    metrics: t("frameworkMetrics.metrics"),
    economic_buyer: t("frameworkMetrics.economic_buyer"),
    decision_criteria: t("frameworkMetrics.decision_criteria"),
    decision_process: t("frameworkMetrics.decision_process"),
    identify_pain: t("frameworkMetrics.identify_pain"),
    champion: t("frameworkMetrics.champion"),
    situation: t("frameworkMetrics.situation"),
    problem: t("frameworkMetrics.problem"),
    implication: t("frameworkMetrics.implication"),
    need_payoff: t("frameworkMetrics.need_payoff"),
  };

  const notScoredLabel = t("scoreStates.notScored");

  return (
    <AppShell>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>{t("eyebrow")}</p>

            <h1 style={heroTitleStyle}>{t("title")}</h1>

            <p style={heroSubtitleStyle}>{t("subtitle")}</p>

            {sessionId ? (
              <div style={heroActionsStyle}>
                <button
                  onClick={() => router.push(`/sessions/${sessionId}`)}
                  style={secondaryButtonStyle}
                >
                  {t("viewDetails")}
                </button>
              </div>
            ) : null}
          </div>

          {overallScore != null ? (
            <div style={scoreCircleStyle}>
              <strong style={{ fontSize: "40px" }}>{overallScore}/10</strong>
              <span style={{ color: "#667085", fontWeight: 700 }}>
                {t("overallScore")}
              </span>
            </div>
          ) : (
            <div style={noScoreNoticeStyle}>
              <span style={infoIconStyle}>i</span>

              <div>
                <strong style={{ color: "#101828", fontSize: "18px" }}>
                  {t("noScoreTitle")}
                </strong>

                <p style={{ color: "#667085", margin: "8px 0 0", lineHeight: "1.5" }}>
                  {t("noScoreDescription")}
                </p>
              </div>
            </div>
          )}
        </section>

        {loading ? (
          <section style={panelStyle}>
            <p style={{ color: "#667085", margin: 0 }}>
              {t("loading")}
            </p>
          </section>
        ) : hasNoPractice ? (
          <section style={panelStyle}>
            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <h2 style={{ margin: 0, color: "#101828" }}>
                  {t("noPracticeTitle")}
                </h2>

                <p style={{ color: "#667085", margin: "8px 0 0" }}>
                  {t("noPracticeDescription")}
                </p>
              </div>

              <button
                onClick={() => router.push("/scenarios")}
                style={primaryButtonStyle}
              >
                {t("startPractice")}
              </button>
            </div>
          </section>
        ) : error ? (
          <section style={panelStyle}>
            <p style={{ color: "#b42318", margin: 0 }}>{error}</p>
          </section>
        ) : !scorecard ? (
          <section style={panelStyle}>
            <p style={{ color: "#667085", margin: 0 }}>
              {t("notFoundForSession")}
            </p>
          </section>
        ) : scorecard.status === "failed" ? (
          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>{t("analysisFailedTitle")}</h2>

            <p style={{ color: "#667085" }}>
              {t("analysisFailedDescription")}
            </p>

            <button
              onClick={async () => {
                if (!sessionId) return;

                try {
                  const response = await authFetch(
                    `${API_BASE_URL}/scorecards/session/${sessionId}/reprocess`,
                    { method: "POST" }
                  );

                  const data = await response.json();

                  if (!response.ok) {
                    alert(data.detail || t("retryFailed"));
                    return;
                  }

                  setPollCount(0);
                  setScorecard((current) =>
                    current ? { ...current, status: "processing" } : current
                  );
                } catch (error) {
                  alert(t("retryFailed"));
                }
              }}
              style={primaryButtonStyle}
            >
              {t("retry")}
            </button>
          </section>
        ) : (
          <>
            <div style={scoreGridStyle}>
              {scoreMetrics(scorecard).map((metric) => (
                <ScoreCard
                  key={metric.key}
                  title={t("callMetrics.fillerWords")}
                  value={metric.value}
                  icon={metric.icon}
                  warning={metric.warning}
                />
              ))}
            </div>

            <div style={twoColumnStyle}>
              <section style={panelStyle}>
                <h2 style={sectionTitleStyle}>{t("sections.callMetrics")}</h2>

                <div style={metricGridStyle}>
                  <Metric
                    title={t("callMetrics.duration")}
                    value={formatDuration(scorecard.call_duration_seconds, notScoredLabel)}
                    icon="⏱️"
                  />
                  <Metric
                    title={t("callMetrics.repTalk")}
                    value={formatPercentage(scorecard.rep_talk_percentage, notScoredLabel)}
                    icon="🎤"
                  />
                  <Metric
                    title={t("callMetrics.interruptions")}
                    value={formatCount(scorecard.interruptions_count, notScoredLabel)}
                    icon="⚡"
                  />
                  <Metric
                    title={t("callMetrics.fillerWords")}
                    value={formatCount(scorecard.filler_words_count, notScoredLabel)}
                    icon="💬"
                  />
                </div>
              </section>

              <section style={panelStyle}>
                <h2 style={sectionTitleStyle}>
                  {t("sections.framework", { framework: frameworkScoreGroup.framework })}
                </h2>
                <div style={frameworkGridStyle}>
                  {frameworkScoreMetrics.map((metric) => (
                    <FrameworkItem
                      key={metric.key}
                      label={frameworkMetricLabels[metric.key] ?? metric.label}
                      value={metric.value}
                      icon={metric.icon}
                    />
                  ))}
                </div>
              </section>
            </div>

            <div style={twoColumnStyle}>
              <section style={panelStyle}>
                <h2 style={sectionTitleStyle}>{t("sections.strengths")}</h2>

                {scorecard.strengths?.length ? (
                  <div style={chipWrapStyle}>
                    {scorecard.strengths.map((item) => (
                      <span key={item} style={greenChipStyle}>
                        ✅ {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={emptyTextStyle}>{t("empty.strengths")}</p>
                )}
              </section>

              <section style={panelStyle}>
                <h2 style={sectionTitleStyle}>{t("sections.improvementAreas")}</h2>

                {scorecard.improvement_areas?.length ? (
                  <div style={chipWrapStyle}>
                    {scorecard.improvement_areas.map((item) => (
                      <span key={item} style={orangeChipStyle}>
                        ⚠️ {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={emptyTextStyle}>
                    {t("empty.improvements")}
                  </p>
                )}
              </section>
            </div>

            <section style={recommendationStyle}>
              <div>
                <h2 style={sectionTitleStyle}>{t("sections.recommendation")}</h2>

                <p
                  style={{
                    color: "#667085",
                    lineHeight: "1.7",
                    maxWidth: "740px",
                  }}
                >
                  {t("recommendationText")}
                </p>
              </div>

              <button
                onClick={() => router.push("/scenarios")}
                style={primaryButtonStyle}
              >
                {t("startAnotherPractice")} →
              </button>
            </section>

            <section style={panelStyle}>
              <h2 style={sectionTitleStyle}>{t("sections.feedbackSummary")}</h2>

              <p style={{ color: "#344054", lineHeight: "1.8", marginBottom: 0 }}>
                {scorecard.feedback_summary ||
                  t("empty.feedback")}
              </p>
            </section>

            {sessionId && (
              <p style={{ color: "#98a2b3", fontSize: "12px", marginTop: "18px" }}>
                {t("internalSessionReference")}
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function ScoreCard({
  title,
  value,
  icon,
  warning,
}: {
  title: string;
  value: number | null | undefined;
  icon: string;
  warning?: boolean;
}) {
  const t = useTranslations("Scorecard");
  const hasScore = value != null;
  const showWarning = Boolean(warning && hasScore);

  return (
    <div
      style={{
        background: showWarning
          ? "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)"
          : hasScore
            ? "linear-gradient(135deg, #ecfdf3 0%, #ffffff 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
        border: showWarning
          ? "1px solid #fed7aa"
          : hasScore
            ? "1px solid #bbf7d0"
            : "1px solid #e2e8f0",
        borderRadius: "22px",
        padding: "24px",
        boxShadow: "0 12px 30px rgba(16,24,40,0.06)",
        minHeight: "170px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, color: "#101828", fontWeight: 800 }}>
            {title}
          </p>
          <span
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "4px 10px",
              borderRadius: "999px",
              background: showWarning ? "#ffedd5" : hasScore ? "#dcfce7" : "#f1f5f9",
              color: showWarning ? "#c2410c" : hasScore ? "#027a48" : "#64748b",
              fontSize: "13px",
              fontWeight: 800,
            }}
          >
            {hasScore ? t("scoreStates.scored") : t("scoreStates.notScored")}
          </span>
        </div>

        <span style={{ fontSize: "24px" }}>{icon}</span>
      </div>

      {hasScore ? (
        <>
          <h2 style={{ margin: "22px 0 8px", fontSize: "34px" }}>
            {value}/10
          </h2>

          <p
            style={{
              margin: 0,
              color: warning ? "#c2410c" : "#027a48",
              fontWeight: 800,
            }}
          >
            {value >= 8
              ? t("scoreStates.strong")
              : value >= 6
                ? t("scoreStates.good")
                : t("scoreStates.needsPractice")}
          </p>
        </>
      ) : (
        <div
          style={{
            marginTop: "38px",
            color: "#98a2b3",
            fontSize: "32px",
            fontWeight: 800,
          }}
        >
          —
        </div>
      )}
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div style={metricCardStyle}>
      <span style={{ fontSize: "24px" }}>{icon}</span>
      <p style={{ margin: "10px 0 4px", color: "#667085" }}>{title}</p>
      <strong style={{ fontSize: "20px" }}>{value}</strong>
    </div>
  );
}

function FrameworkItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | null | undefined;
  icon: string;
}) {
  const t = useTranslations("Scorecard");

  return (
    <div style={frameworkItemStyle}>
      <span style={{ fontSize: "22px" }}>{icon}</span>

      <div>
        <p style={{ margin: 0, color: "#667085", fontSize: "13px" }}>
          {label}
        </p>
        <strong>{value != null ? `${value}/10` : t("scoreStates.notScored")}</strong>
      </div>
    </div>
  );
}

function formatDuration(seconds: number | null | undefined, notScoredLabel: string) {
  if (seconds == null) return notScoredLabel;
  if (!seconds) return "0s";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (!minutes) return `${remainingSeconds}s`;

  return `${minutes}m ${remainingSeconds}s`;
}

function formatPercentage(value: number | null | undefined, notScoredLabel: string) {
  if (value == null) return notScoredLabel;

  return `${value}%`;
}

function formatCount(value: number | null | undefined, notScoredLabel: string) {
  if (value == null) return notScoredLabel;

  return `${value}`;
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
  maxWidth: "640px",
};

const heroActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const scoreCircleStyle: React.CSSProperties = {
  width: "150px",
  height: "150px",
  borderRadius: "999px",
  background: "white",
  border: "12px solid #006b4f",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 16px 30px rgba(0,107,79,0.18)",
};

const noScoreNoticeStyle: React.CSSProperties = {
  minWidth: "320px",
  maxWidth: "360px",
  padding: "22px 24px",
  borderRadius: "18px",
  background: "rgba(255, 255, 255, 0.72)",
  border: "1px solid #bfdbfe",
  display: "flex",
  alignItems: "center",
  gap: "18px",
  boxShadow: "0 16px 30px rgba(16,24,40,0.08)",
};

const infoIconStyle: React.CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  border: "3px solid #2563eb",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: "22px",
  flexShrink: 0,
};

const scoreGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "28px",
};

const twoColumnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
  marginBottom: "28px",
};

const panelStyle: React.CSSProperties = {
  background: "white",
  padding: "26px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
};

const recommendationStyle: React.CSSProperties = {
  ...panelStyle,
  background: "linear-gradient(135deg, #ffffff 0%, #ecfdf3 100%)",
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  alignItems: "center",
  marginBottom: "28px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  color: "#101828",
};

const metricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "14px",
  marginTop: "18px",
};

const metricCardStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #eef2f6",
  borderRadius: "18px",
  padding: "18px",
  textAlign: "center",
};

const frameworkGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
  marginTop: "18px",
};

const frameworkItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "#f9fafb",
  border: "1px solid #eef2f6",
  borderRadius: "16px",
  padding: "14px",
};

const chipWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginTop: "18px",
};

const greenChipStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "#ecfdf3",
  color: "#027a48",
  fontWeight: 800,
};

const orangeChipStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "#fff7ed",
  color: "#c2410c",
  fontWeight: 800,
};

const emptyTextStyle: React.CSSProperties = {
  color: "#667085",
  marginBottom: 0,
  marginTop: "18px",
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

const secondaryButtonStyle: React.CSSProperties = {
  padding: "14px 24px",
  borderRadius: "14px",
  border: "1px solid #d0d5dd",
  background: "white",
  color: "#006b4f",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(16,24,40,0.06)",
  whiteSpace: "nowrap",
};
