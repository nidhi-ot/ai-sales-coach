"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "../../../../components/AppShell";
import { API_BASE_URL, authFetch } from "../../../../lib/api";

type Session = {
  id: string;
  scenario?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  status?: string | null;
};

type Scorecard = {
  id?: string;
  session_id?: string;
  created_at?: string | null;
  rapport_score?: number | null;
  needs_discovery_score?: number | null;
  objection_handling_score?: number | null;
  closing_score?: number | null;
};

type Transcript = {
  id?: string;
  session_id?: string;
  speaker?: string | null;
  text?: string | null;
  timestamp_offset_ms?: number | null;
};

export default function TeamRepDetailsPage() {
  const params = useParams();
  const repId = params.rep_id as string;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRepDetails() {
      try {
        const [sessionsRes, scorecardsRes, transcriptsRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/manager/reps/${repId}/sessions`),
          authFetch(`${API_BASE_URL}/manager/reps/${repId}/scorecards`),
          authFetch(`${API_BASE_URL}/manager/reps/${repId}/transcripts`),
        ]);

        const sessionsData = await sessionsRes.json();
        const scorecardsData = await scorecardsRes.json();
        const transcriptsData = await transcriptsRes.json();

        setSessions(sessionsData.sessions ?? []);
        setScorecards(scorecardsData.scorecards ?? []);
        setTranscripts(transcriptsData.transcripts ?? []);
      } catch (error) {
        console.error("Failed to load rep details:", error);
      } finally {
        setLoading(false);
      }
    }

    if (repId) {
      loadRepDetails();
    }
  }, [repId]);

  const latestScorecard = scorecards[0];

  const groupedTranscripts = useMemo(() => {
    const result: Record<string, Transcript[]> = {};

    transcripts.forEach((line) => {
      if (!line.session_id) return;

      if (!result[line.session_id]) {
        result[line.session_id] = [];
      }

      result[line.session_id].push(line);
    });

    return result;
  }, [transcripts]);

  return (
    <AppShell>
      <div style={containerStyle}>
        <div style={topBarStyle}>
          <div>
            <Link href="/team" style={backLinkStyle}>
              ← Back to Team
            </Link>

            <p style={eyebrowStyle}>Manager View</p>
            <h1 style={titleStyle}>Rep Details</h1>
            <p style={subtitleStyle}>
              Review this rep&apos;s practice history, scorecards, and transcripts.
            </p>
          </div>
        </div>

        {loading ? (
          <section style={cardStyle}>
            <p style={mutedStyle}>Loading rep details...</p>
          </section>
        ) : (
          <>
            <section style={summaryGridStyle}>
              <SummaryCard title="Sessions" value={sessions.length.toString()} />
              <SummaryCard title="Scorecards" value={scorecards.length.toString()} />
              <SummaryCard
                title="Latest Score"
                value={
                  latestScorecard
                    ? `${getAverageScore(latestScorecard)}%`
                    : "N/A"
                }
              />
              <SummaryCard
                title="Last Practice"
                value={
                  sessions[0]?.started_at
                    ? new Date(sessions[0].started_at).toLocaleDateString()
                    : "N/A"
                }
              />
            </section>

            <section style={layoutStyle}>
              <div style={mainColumnStyle}>
                <section style={cardStyle}>
                  <h2 style={cardTitleStyle}>Practice Sessions</h2>

                  {sessions.length === 0 ? (
                    <p style={mutedStyle}>No sessions found for this rep.</p>
                  ) : (
                    <div style={listStyle}>
                      {sessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          scorecard={scorecards.find(
                            (scorecard) => scorecard.session_id === session.id
                          )}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section style={cardStyle}>
                  <h2 style={cardTitleStyle}>Transcript Preview</h2>

                  {sessions.length === 0 ? (
                    <p style={mutedStyle}>No transcripts available.</p>
                  ) : (
                    <div style={listStyle}>
                      {sessions.slice(0, 3).map((session) => {
                        const lines = groupedTranscripts[session.id] ?? [];

                        return (
                          <div key={session.id} style={transcriptBlockStyle}>
                            <h3 style={smallTitleStyle}>
                              {formatScenario(session.scenario ?? "Practice Session")}
                            </h3>

                            {lines.length === 0 ? (
                              <p style={mutedStyle}>No transcript saved for this session.</p>
                            ) : (
                              lines.slice(0, 6).map((line, index) => (
                                <div key={`${line.id ?? index}`} style={transcriptLineStyle}>
                                  <strong>{line.speaker ?? "Speaker"}:</strong>{" "}
                                  <span>{line.text ?? ""}</span>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              <aside style={sideColumnStyle}>
                <section style={cardStyle}>
                  <h2 style={cardTitleStyle}>Latest Scorecard</h2>

                  {latestScorecard ? (
                    <>
                      <ScoreRow label="Rapport" value={latestScorecard.rapport_score} />
                      <ScoreRow label="Discovery" value={latestScorecard.needs_discovery_score} />
                      <ScoreRow
                        label="Objection Handling"
                        value={latestScorecard.objection_handling_score}
                      />
                      <ScoreRow label="Closing" value={latestScorecard.closing_score} />
                    </>
                  ) : (
                    <p style={mutedStyle}>No scorecard available yet.</p>
                  )}
                </section>

                <section style={cardStyle}>
                  <h2 style={cardTitleStyle}>Manager Coaching Notes</h2>
                  <p style={mutedStyle}>
                    Use this view to identify patterns, review objections, and prepare
                    targeted feedback for the rep.
                  </p>
                </section>
              </aside>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function SessionCard({
  session,
  scorecard,
}: {
  session: Session;
  scorecard?: Scorecard;
}) {
  return (
    <div style={sessionCardStyle}>
      <div>
        <strong>{formatScenario(session.scenario ?? "Practice Session")}</strong>
        <p style={mutedStyle}>
          {session.started_at
            ? new Date(session.started_at).toLocaleString()
            : "No start date"}
        </p>
        <p style={mutedStyle}>Status: {session.status ?? "Unknown"}</p>
      </div>

      <div style={rightStyle}>
        <ScoreBadge score={scorecard ? getAverageScore(scorecard) : null} />
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={summaryCardStyle}>
      <p style={summaryTitleStyle}>{title}</p>
      <strong style={summaryValueStyle}>{value}</strong>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value?: number | null }) {
  const safeValue = value ?? 0;

  return (
    <div style={scoreRowStyle}>
      <div style={scoreTopStyle}>
        <span>{label}</span>
        <strong>{value == null ? "N/A" : `${safeValue}%`}</strong>
      </div>

      <div style={trackStyle}>
        <div style={{ ...fillStyle, width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) {
    return <span style={neutralBadgeStyle}>N/A</span>;
  }

  return <span style={scoreBadgeStyle}>{score}%</span>;
}

function getAverageScore(scorecard: Scorecard) {
  const values = [
    scorecard.rapport_score,
    scorecard.needs_discovery_score,
    scorecard.objection_handling_score,
    scorecard.closing_score,
  ].filter((value): value is number => typeof value === "number");

  if (values.length === 0) return 0;

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatScenario(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const containerStyle = {
  maxWidth: "1280px",
  margin: "0 auto",
};

const topBarStyle = {
  marginBottom: "28px",
};

const backLinkStyle = {
  display: "inline-flex",
  marginBottom: "18px",
  color: "#00704f",
  textDecoration: "none",
  fontWeight: 800,
};

const eyebrowStyle = {
  margin: 0,
  color: "#00704f",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const titleStyle = {
  margin: "8px 0",
  fontSize: "42px",
  fontWeight: 950,
};

const subtitleStyle = {
  margin: 0,
  color: "#667085",
  fontSize: "17px",
  lineHeight: 1.6,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "18px",
  marginBottom: "24px",
};

const summaryCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "22px",
  padding: "24px",
  boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
};

const summaryTitleStyle = {
  margin: 0,
  color: "#667085",
  fontWeight: 700,
};

const summaryValueStyle = {
  display: "block",
  marginTop: "10px",
  fontSize: "32px",
  color: "#00704f",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  gap: "24px",
};

const mainColumnStyle = {
  display: "grid",
  gap: "24px",
};

const sideColumnStyle = {
  display: "grid",
  gap: "24px",
  alignSelf: "start",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "26px",
  boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
};

const cardTitleStyle = {
  margin: "0 0 18px",
  fontSize: "22px",
  fontWeight: 900,
};

const listStyle = {
  display: "grid",
  gap: "14px",
};

const sessionCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  background: "#f8fbf9",
};

const rightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const mutedStyle = {
  margin: "5px 0 0",
  color: "#667085",
  lineHeight: 1.5,
};

const scoreBadgeStyle = {
  display: "inline-flex",
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#dff5ea",
  color: "#00704f",
  fontWeight: 900,
};

const neutralBadgeStyle = {
  display: "inline-flex",
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#f2f4f7",
  color: "#667085",
  fontWeight: 800,
};

const scoreRowStyle = {
  padding: "15px 0",
  borderTop: "1px solid #eef2f7",
};

const scoreTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  fontWeight: 800,
};

const trackStyle = {
  height: "10px",
  borderRadius: "999px",
  background: "#eef2f7",
  overflow: "hidden",
};

const fillStyle = {
  height: "100%",
  borderRadius: "999px",
  background: "#00704f",
};

const transcriptBlockStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  background: "#f8fbf9",
};

const smallTitleStyle = {
  margin: "0 0 12px",
  fontSize: "17px",
};

const transcriptLineStyle = {
  padding: "10px 0",
  borderTop: "1px solid #e5e7eb",
};