"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";

type Session = {
  id: string;
  scenario: string;
  started_at: string;
  duration_seconds: number | null;
  status: string;
  shared_with_manager?: boolean;
  overall_score?: number | null;
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const repId = localStorage.getItem("rep_id");

    if (!repId) {
      setLoading(false);
      return;
    }

    fetch(`http://127.0.0.1:8000/api/v1/sessions/rep/${repId}`)
      .then((res) => res.json())
      .then(async (data) => {
        const safeSessions = Array.isArray(data)
          ? data.map((session) => ({
              ...session,
              shared_with_manager: session.shared_with_manager ?? false,
            }))
          : [];

        const sessionsWithScores = await Promise.all(
          safeSessions.map(async (session) => {
            try {
              const scorecardResponse = await fetch(
                `http://127.0.0.1:8000/api/v1/scorecards/${session.id}`
              );

              if (!scorecardResponse.ok) {
                return session;
              }

              const scorecard = await scorecardResponse.json();

              return {
                ...session,
                overall_score: scorecard.overall_score ?? null,
              };
            } catch {
              return session;
            }
          })
        );

        setSessions(sessionsWithScores);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load sessions:", error);
        setLoading(false);
      });
  }, []);

  async function updateSharing(sessionId: string, shared: boolean) {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId
          ? { ...session, shared_with_manager: shared }
          : session
      )
    );

    try {
      await fetch(
        `http://127.0.0.1:8000/api/v1/scorecards/session/${sessionId}/share`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shared_with_manager: shared,
          }),
        }
      );
    } catch (error) {
      console.error("Failed to update sharing:", error);
    }
  }

  return (
    <AppShell>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ marginBottom: "8px" }}>Session History</h1>
        <p style={{ color: "#667085" }}>
          Review your previous AI Sales Coach practice sessions.
        </p>
      </div>

      <section
        style={{
          background: "white",
          borderRadius: "18px",
          padding: "24px",
          border: "1px solid #e5e7eb",
        }}
      >
        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: "#667085" }}>No practice sessions found yet.</p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.3fr 0.8fr 1fr 1.2fr 0.8fr",
                fontWeight: 700,
                paddingBottom: "12px",
                borderBottom: "1px solid #e5e7eb",
                marginBottom: "12px",
              }}
            >
              <div>Scenario</div>
              <div>Date</div>
              <div>Score</div>
              <div>Status</div>
              <div>Share</div>
              <div>Action</div>
            </div>

            {sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1.3fr 0.8fr 1fr 1.2fr 0.8fr",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid #f2f4f7",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {session.scenario.replace("_", " ")}
                </div>

                <div style={{ color: "#667085" }}>
                  {session.started_at
                    ? new Date(session.started_at).toLocaleDateString()
                    : "-"}
                </div>

                <div style={{ fontWeight: 700, color: "#006b4f" }}>
                  {session.overall_score != null ? `${session.overall_score}/10` : "Pending"}
                </div>

                <div>
                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background:
                        session.status === "completed" ? "#e7f4ef" : "#fff4e5",
                      color:
                        session.status === "completed" ? "#027a48" : "#b54708",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {session.status}
                  </span>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#344054",
                    fontSize: "14px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(session.shared_with_manager)}
                    onChange={(e) =>
                      updateSharing(session.id, e.target.checked)
                    }
                  />
                  Manager
                </label>

                <div>
                  <button
                    onClick={() =>
                      router.push(`/scorecards?session_id=${session.id}`)
                    }
                    style={{
                      padding: "8px 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#006b4f",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </section>
    </AppShell>
  );
}