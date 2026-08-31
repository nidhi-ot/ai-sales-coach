"use client";

import { useTranslations } from "next-intl";
import {
  frameworkMetrics,
  type FrameworkMetric,
  type FrameworkScores,
} from "../../lib/frameworkScores";

export type Scorecard = {
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
};

type ScoreMetric = {
  key: string;
  value: number | null | undefined;
};

type ScorecardViewProps = {
  scorecard: Scorecard;
};

function scoreMetrics(scorecard: Scorecard): ScoreMetric[] {
  return [
    { key: "overall", value: scorecard.overall_score },
    { key: "rapport", value: scorecard.rapport_score },
    {
      key: "needs",
      value: scorecard.needs_discovery_score,
    },
    {
      key: "objections",
      value: scorecard.objection_handling_score,
    },
    { key: "closing", value: scorecard.closing_score },
  ];
}

export default function ScorecardView({ scorecard }: ScorecardViewProps) {
  const t = useTranslations("Scorecard");
  const hasOverallScore = scorecard.overall_score != null;
  const frameworkScoreGroup = frameworkMetrics(scorecard.framework_scores);
  const frameworkScoreMetrics: FrameworkMetric[] = frameworkScoreGroup.metrics;
  const notScored = t("scoreStates.notScored");
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

  return (
    <>
      <section
        style={{
          background: "#ffffff",
          padding: "28px",
          borderRadius: "18px",
          border: "1px solid #e5e7eb",
          marginTop: "24px",
        }}
      >
        <p style={{ color: "#667085", margin: 0 }}>{t("overallScore")}</p>
        <p
          style={{
            fontSize: "48px",
            fontWeight: 800,
            margin: "8px 0 0",
            color: "#006b4f",
          }}
        >
          {hasOverallScore ? `${scorecard.overall_score}/10` : notScored}
        </p>
        {!hasOverallScore ? (
          <p style={{ margin: "10px 0 0", color: "#667085" }}>
            {t("analysisPending")}
          </p>
        ) : null}
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "18px",
          marginTop: "18px",
        }}
      >
        {scoreMetrics(scorecard)
          .filter((metric) => metric.key !== "overall")
          .map((metric) => (
            <section
              key={metric.key}
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "18px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                {scoreMetricLabels[metric.key] ?? metric.key}
              </h2>
              <p style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
                {metric.value != null ? `${metric.value}/10` : notScored}
              </p>
            </section>
          ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "18px",
          marginTop: "18px",
        }}
      >
        <section
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "18px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{t("sections.callMetrics")}</h2>
          <p style={{ color: "#344054", lineHeight: "1.8", marginBottom: 0 }}>
            {t("callMetrics.duration")}:{" "}
            {formatDuration(scorecard.call_duration_seconds, notScored)}
            <br />
            {t("callMetrics.repTalk")}:{" "}
            {formatPercentage(scorecard.rep_talk_percentage, notScored)}
            <br />
            {t("callMetrics.interruptions")}:{" "}
            {formatCount(scorecard.interruptions_count, notScored)}
            <br />
            {t("callMetrics.fillerWords")}:{" "}
            {formatCount(scorecard.filler_words_count, notScored)}
          </p>
        </section>

        <section
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "18px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {t("sections.framework", { framework: frameworkScoreGroup.framework })}
          </h2>
          <p style={{ color: "#344054", lineHeight: "1.8", marginBottom: 0 }}>
            {frameworkScoreMetrics.map((metric, index) => (
              <span key={metric.key}>
                {frameworkMetricLabels[metric.key] ?? metric.label}:{" "}
                {metric.value != null ? `${metric.value}/10` : notScored}
                {index < frameworkScoreMetrics.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        </section>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "18px",
          marginTop: "18px",
        }}
      >
        <section
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "18px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{t("sections.strengths")}</h2>
          {scorecard.strengths?.length ? (
            <ul style={{ color: "#344054", lineHeight: "1.8", paddingLeft: "20px" }}>
              {scorecard.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#667085", marginBottom: 0 }}>
              {t("empty.strengths")}
            </p>
          )}
        </section>

        <section
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "18px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{t("sections.improvementAreas")}</h2>
          {scorecard.improvement_areas?.length ? (
            <ul style={{ color: "#344054", lineHeight: "1.8", paddingLeft: "20px" }}>
              {scorecard.improvement_areas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#667085", marginBottom: 0 }}>
              {t("empty.improvements")}
            </p>
          )}
        </section>
      </div>

      <section
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "18px",
          border: "1px solid #e5e7eb",
          marginTop: "18px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>{t("sections.feedbackSummary")}</h2>
        <p style={{ color: "#344054", lineHeight: "1.8", marginBottom: 0 }}>
          {scorecard.feedback_summary || t("empty.feedback")}
        </p>
      </section>
    </>
  );
}

function formatDuration(seconds: number | null | undefined, fallback: string) {
  if (seconds == null) return fallback;
  if (seconds === 0) return "0s";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (!minutes) return `${remainingSeconds}s`;

  return `${minutes}m ${remainingSeconds}s`;
}

function formatPercentage(value: number | null | undefined, fallback: string) {
  if (value == null) return fallback;

  return `${value}%`;
}

function formatCount(value: number | null | undefined, fallback: string) {
  if (value == null) return fallback;

  return `${value}`;
}
