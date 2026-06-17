"use client";

import { useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";

const metrics = [
  {
    name: "Budget",
    score: 8,
    evidence: "Rep asked about budget range and positioned value clearly.",
  },
  {
    name: "Authority",
    score: 7,
    evidence: "Rep identified who is involved in the buying decision.",
  },
  {
    name: "Need",
    score: 9,
    evidence: "Rep uncovered clear business pain points during discovery.",
  },
  {
    name: "Timeline",
    score: 6,
    evidence: "Rep asked when the customer wants to improve sales outcomes.",
  },
];

export default function ScorecardsPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "18px",
          marginTop: "24px",
        }}
      >
        {metrics.map((metric) => (
          <section
            key={metric.name}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "18px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2 style={{ marginTop: 0 }}>{metric.name}</h2>

            <p
              style={{
                fontSize: "28px",
                fontWeight: 700,
                margin: "8px 0",
              }}
            >
              {metric.score}/10
            </p>

            <p style={{ color: "#667085", lineHeight: "1.6" }}>
              <strong>Evidence:</strong> {metric.evidence}
            </p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}