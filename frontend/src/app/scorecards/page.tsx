"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import ScorecardView, {
  type Scorecard,
} from "../../components/scorecards/ScorecardView";
import { API_BASE_URL } from "../../lib/api";

export default function ScorecardsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
          `${API_BASE_URL}/scorecards/${resolvedSessionId}`
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
        <ScorecardView scorecard={scorecard} />
      )}

      <button
        onClick={() => router.push("/dashboard")}
        style={{
          marginTop: "24px",
          padding: "14px 22px",
          borderRadius: "12px",
          border: "1px solid #d0d5dd",
          background: "white",
          color: "#344054",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Back to Dashboard
      </button>
    </AppShell>
  );
}
