import AppShell from "../../components/AppShell";

export default function ProgressPage() {
  return (
    <AppShell>
      <h1>Progress</h1>

      <p style={{ color: "#667085", marginBottom: "24px" }}>
        Track your AI Sales Coach improvement over time.
      </p>

      <section
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "18px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2>Progress Overview</h2>

        <p style={{ color: "#667085" }}>
          Your progress data will appear here after completing more practice
          sessions.
        </p>
      </section>
    </AppShell>
  );
}