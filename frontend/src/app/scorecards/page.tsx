"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";

type FrameworkScores = {
  budget?: number;
  authority?: number;
  need?: number;
  timeline?: number;
};

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
};

type ScoreMetric = {
  key: string;
  label: string;
  value: number | null | undefined;
};

const scoreMetrics = (scorecard: Scorecard): ScoreMetric[] => [
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

const frameworkMetrics = (scorecard: Scorecard): ScoreMetric[] => [
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

export default function ScorecardsPage() {
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("session_id");
  const [sessionId, setSessionId] = useState<string | null>(querySessionId);

  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const resolvedSessionId =
      querySessionId || localStorage.getItem("last_session_id");

    if (!resolvedSessionId) {
      setError("No session ID found.");
      setLoading(false);
      return;
    }

    setSessionId(resolvedSessionId);

    async function loadScorecard() {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/scorecards/${resolvedSessionId}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.detail || "Scorecard not found.");
          return;
        }

        setScorecard(data);
      } catch (error) {
        console.error("Failed to load scorecard:", error);
        setError("Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    loadScorecard();
  }, [querySessionId]);

  return (
    <AppShell>
      <h1 style={{ marginBottom: "8px" }}>Scorecard Display</h1>

      <p style={{ color: "#667085", marginBottom: "24px" }}>
        AI Sales Coach evaluation for this practice session.
      </p>

      {sessionId && (
        <p style={{ color: "#98a2b3", fontSize: "13px" }}>
          Session ID: {sessionId}
        </p>
      )}

      {loading ? (
        <p>Loading scorecard...</p>
      ) : error ? (
        <p style={{ color: "#b42318" }}>{error}</p>
      ) : !scorecard ? (
        <p style={{ color: "#667085" }}>
          No scorecard found for this session.
        </p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "18px",
              marginTop: "24px",
            }}
          >
            {scoreMetrics(scorecard).map((metric) => (
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
                  {metric.value ?? 0}/10
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
                Duration: {scorecard.call_duration_seconds ?? 0}s
                <br />
                Rep Talk %: {scorecard.rep_talk_percentage ?? 0}%
                <br />
                Interruptions: {scorecard.interruptions_count ?? 0}
                <br />
                Filler Words: {scorecard.filler_words_count ?? 0}
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
                {frameworkMetrics(scorecard).map((metric, index) => (
                  <span key={metric.key}>
                    {metric.label}: {metric.value ?? 0}/10
                    {index < frameworkMetrics(scorecard).length - 1 ? <br /> : null}
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
      )}
    </AppShell>
  );
}
