import AppShell from "../../components/AppShell";

export default function ScorecardsPage() {
  return (
    <AppShell>
      <h1>Scorecards</h1>

      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "18px",
          border: "1px solid #e5e7eb",
          marginTop: "24px",
        }}
      >
        <h2>Session Analysis</h2>

        <p style={{ color: "#667085" }}>
          Scorecard analysis will appear here after session evaluation.
        </p>
      </div>
    </AppShell>
  );
}