type FrameworkScores = {
  budget?: number;
  authority?: number;
  need?: number;
  timeline?: number;
};

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
  shared_with_manager?: boolean | null;
};

type ScoreMetric = {
  key: string;
  label: string;
  value: number | null | undefined;
};

type ScorecardViewProps = {
  scorecard: Scorecard;
};

function scoreMetrics(scorecard: Scorecard): ScoreMetric[] {
  return [
    { key: "overall", label: "Overall Score", value: scorecard.overall_score },
    { key: "rapport", label: "Rapport", value: scorecard.rapport_score },
    {
      key: "needs",
      label: "Needs Discovery",
      value: scorecard.needs_discovery_score,
    },
    {
      key: "objections",
      label: "Objection Handling",
      value: scorecard.objection_handling_score,
    },
    { key: "closing", label: "Closing", value: scorecard.closing_score },
  ];
}

function frameworkMetrics(scorecard: Scorecard): ScoreMetric[] {
  return [
    {
      key: "budget",
      label: "Budget",
      value: scorecard.framework_scores?.budget,
    },
    {
      key: "authority",
      label: "Authority",
      value: scorecard.framework_scores?.authority,
    },
    {
      key: "need",
      label: "Need",
      value: scorecard.framework_scores?.need,
    },
    {
      key: "timeline",
      label: "Timeline",
      value: scorecard.framework_scores?.timeline,
    },
  ];
}

export default function ScorecardView({ scorecard }: ScorecardViewProps) {
  const hasOverallScore = scorecard.overall_score != null;
  const frameworkScoreMetrics = frameworkMetrics(scorecard);

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
        <p style={{ color: "#667085", margin: 0 }}>Overall Score</p>
        <p
          style={{
            fontSize: "48px",
            fontWeight: 800,
            margin: "8px 0 0",
            color: "#006b4f",
          }}
        >
          {hasOverallScore ? `${scorecard.overall_score}/10` : "Not scored"}
        </p>
        {!hasOverallScore ? (
          <p style={{ margin: "10px 0 0", color: "#667085" }}>
            Scorecard analysis is still pending for this session.
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
              <h2 style={{ marginTop: 0 }}>{metric.label}</h2>
              <p style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
                {metric.value != null ? `${metric.value}/10` : "Not scored"}
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
          <h2 style={{ marginTop: 0 }}>Call Metrics</h2>
          <p style={{ color: "#344054", lineHeight: "1.8", marginBottom: 0 }}>
            Duration: {formatDuration(scorecard.call_duration_seconds)}
            <br />
            Rep Talk %: {formatPercentage(scorecard.rep_talk_percentage)}
            <br />
            Interruptions: {formatCount(scorecard.interruptions_count)}
            <br />
            Filler Words: {formatCount(scorecard.filler_words_count)}
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
          <h2 style={{ marginTop: 0 }}>BANT Framework</h2>
          <p style={{ color: "#344054", lineHeight: "1.8", marginBottom: 0 }}>
            {frameworkScoreMetrics.map((metric, index) => (
              <span key={metric.key}>
                {metric.label}: {metric.value != null ? `${metric.value}/10` : "Not scored"}
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
          <h2 style={{ marginTop: 0 }}>Strengths</h2>
          {scorecard.strengths?.length ? (
            <ul style={{ color: "#344054", lineHeight: "1.8", paddingLeft: "20px" }}>
              {scorecard.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#667085", marginBottom: 0 }}>No strengths provided yet.</p>
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
          <h2 style={{ marginTop: 0 }}>Improvement Areas</h2>
          {scorecard.improvement_areas?.length ? (
            <ul style={{ color: "#344054", lineHeight: "1.8", paddingLeft: "20px" }}>
              {scorecard.improvement_areas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#667085", marginBottom: 0 }}>
              No improvement areas provided yet.
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
        <h2 style={{ marginTop: 0 }}>Feedback Summary</h2>
        <p style={{ color: "#344054", lineHeight: "1.8", marginBottom: 0 }}>
          {scorecard.feedback_summary || "Feedback summary is not available yet."}
        </p>
      </section>
    </>
  );
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) return "Not scored";
  if (seconds === 0) return "0s";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (!minutes) return `${remainingSeconds}s`;

  return `${minutes}m ${remainingSeconds}s`;
}

function formatPercentage(value?: number | null) {
  if (value == null) return "Not scored";

  return `${value}%`;
}

function formatCount(value?: number | null) {
  if (value == null) return "Not scored";

  return `${value}`;
}
