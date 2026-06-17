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
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load sessions:", error);
        setLoading(false);
      });
  }, []);

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
          <p style={{ color: "#667085" }}>
            No practice sessions found yet.
          </p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1fr 1fr",
                fontWeight: 700,
                paddingBottom: "12px",
                borderBottom: "1px solid #e5e7eb",
                marginBottom: "12px",
              }}
            >
              <div>Scenario</div>
              <div>Date</div>
              <div>Status</div>
              <div>Action</div>
            </div>

            {sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1fr 1fr",
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

                <div>
                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background:
                        session.status === "completed"
                          ? "#e7f4ef"
                          : "#fff4e5",
                      color:
                        session.status === "completed"
                          ? "#027a48"
                          : "#b54708",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {session.status}
                  </span>
                </div>

                <div>
                  <button
                    onClick={() => router.push("/scorecards")}
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
                    View Scorecard
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