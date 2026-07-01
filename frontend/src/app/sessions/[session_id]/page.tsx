"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "../../../components/AppShell";
import { API_BASE_URL } from "../../../lib/api";

type SessionTranscriptEntry = {
  speaker: "rep" | "ai_customer";
  text: string;
  timestamp_offset_ms?: number | null;
  created_at?: string | null;
};

type SessionDetails = {
  id: string;
  title: string;
  status?: string | null;
  created_at?: string | null;
  ended_at?: string | null;
  transcript: SessionTranscriptEntry[];
  duration?: number | null;
  scenario?: string | null;
  scorecard_id?: string | null;
};

export default function SessionDetailsPage() {
  const router = useRouter();
  const params = useParams() as { session_id?: string | string[] };
  const routeSessionId = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id;
  const sessionId = routeSessionId || null;

  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found.");
      setLoading(false);
      return;
    }

    async function loadDetails() {
      try {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.detail || "Session not found.");
          return;
        }

        setDetails(data);
      } catch (requestError) {
        console.error("Failed to load session details:", requestError);
        setError("Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [sessionId]);

  return (
    <AppShell>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Session Details</p>

            <h1 style={heroTitleStyle}>
              {details?.title || "Practice Session"}
            </h1>

            <p style={heroSubtitleStyle}>
              Review the full transcript, status, and timing for this practice
              call.
            </p>

            <div style={heroActionsStyle}>
              {sessionId ? (
                <button
                  onClick={() => router.push(`/scorecards?session_id=${sessionId}`)}
                  style={secondaryButtonStyle}
                >
                  View Scorecard
                </button>
              ) : null}

              <button onClick={() => router.push("/history")} style={primaryButtonStyle}>
                Back to History
              </button>
            </div>
          </div>

          <div style={summaryCardStyle}>
            <p style={{ margin: 0, color: "#667085", fontSize: "13px" }}>
              Session Status
            </p>
            <strong style={{ fontSize: "24px", color: "#101828" }}>
              {details?.status || "Unknown"}
            </strong>
          </div>
        </section>

        {loading ? (
          <section style={panelStyle}>
            <p style={{ color: "#667085", margin: 0 }}>Loading session details...</p>
          </section>
        ) : error ? (
          <section style={panelStyle}>
            <p style={{ color: "#b42318", margin: 0 }}>{error}</p>
          </section>
        ) : !details ? (
          <section style={panelStyle}>
            <p style={{ color: "#667085", margin: 0 }}>
              No session details found for this call.
            </p>
          </section>
        ) : (
          <>
            <section style={panelStyle}>
              <h2 style={sectionTitleStyle}>Session Summary</h2>

              <div style={summaryGridStyle}>
                <SummaryItem
                  label="Scenario"
                  value={formatScenario(details.scenario || details.title)}
                />
                <SummaryItem
                  label="Started"
                  value={formatDate(details.created_at)}
                />
                <SummaryItem label="Ended" value={formatDate(details.ended_at)} />
                <SummaryItem
                  label="Duration"
                  value={formatDuration(details.duration)}
                />
              </div>
            </section>

            <section style={panelStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Transcript</h2>
                  <p style={sectionSubtitleStyle}>
                    {details.transcript.length} transcript entries captured for this
                    session.
                  </p>
                </div>
              </div>

              {details.transcript.length === 0 ? (
                <p style={{ color: "#667085", margin: 0 }}>
                  No transcript entries were stored for this session.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
                  {details.transcript.map((entry, index) => (
                    <div key={`${entry.speaker}-${index}`} style={transcriptItemStyle}>
                      <div style={transcriptMetaStyle}>
                        <span
                          style={{
                            ...speakerBadgeStyle,
                            background:
                              entry.speaker === "rep" ? "#ecfdf3" : "#eff8ff",
                            color: entry.speaker === "rep" ? "#027a48" : "#175cd3",
                          }}
                        >
                          {entry.speaker === "rep" ? "Rep" : "AI Customer"}
                        </span>

                        <span style={{ color: "#667085", fontSize: "13px" }}>
                          {formatOffset(entry.timestamp_offset_ms)}
                        </span>
                      </div>

                      <p style={{ margin: "10px 0 0", color: "#101828", lineHeight: 1.6 }}>
                        {entry.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryItemStyle}>
      <p style={{ margin: 0, color: "#667085", fontSize: "14px" }}>{label}</p>
      <strong style={{ color: "#101828", fontSize: "18px" }}>{value}</strong>
    </div>
  );
}

function formatScenario(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatDuration(totalSeconds?: number | null) {
  if (totalSeconds == null) return "Not scored";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatOffset(offset?: number | null) {
  if (offset == null) return "0:00";
  return formatDuration(Math.floor(offset / 1000));
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
  gap: "24px",
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

const summaryCardStyle: React.CSSProperties = {
  minWidth: "180px",
  background: "rgba(255,255,255,0.78)",
  borderRadius: "18px",
  padding: "20px",
  border: "1px solid #dfeee8",
  textAlign: "right",
};

const panelStyle: React.CSSProperties = {
  background: "white",
  padding: "26px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
  marginBottom: "24px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  color: "#101828",
};

const sectionSubtitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
  marginTop: "18px",
};

const summaryItemStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #eef2f6",
  borderRadius: "18px",
  padding: "18px",
};

const transcriptItemStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #eef2f6",
  borderRadius: "18px",
  padding: "18px",
};

const transcriptMetaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const speakerBadgeStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "1px solid #d0d5dd",
  background: "white",
  color: "#006b4f",
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "#006b4f",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
