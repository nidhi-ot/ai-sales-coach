"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";

type Metric = {
  name: string;
  score: number;
  evidence: string;
};

export default function ScorecardsPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found.");
      setLoading(false);
      return;
    }

    async function loadScorecard() {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/scorecards/${sessionId}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.detail || "Scorecard not found.");
          return;
        }

        setMetrics(data.metrics || []);
      } catch (error) {
        console.error("Failed to load scorecard:", error);
        setError("Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    loadScorecard();
  }, [sessionId]);

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
      ) : metrics.length === 0 ? (
        <p style={{ color: "#667085" }}>
          No scorecard metrics found for this session.
        </p>
      ) : (
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

              <p style={{ fontSize: "28px", fontWeight: 700 }}>
                {metric.score}/10
              </p>

              <p style={{ color: "#667085", lineHeight: "1.6" }}>
                <strong>Evidence:</strong> {metric.evidence}
              </p>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}