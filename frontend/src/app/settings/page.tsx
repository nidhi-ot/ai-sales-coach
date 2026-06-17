import AppShell from "../../components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell>
      <h1>Settings</h1>

      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "18px",
          border: "1px solid #e5e7eb",
          marginTop: "24px",
        }}
      >
        <h2>Application Settings</h2>

        <p style={{ color: "#667085" }}>
          Settings and preferences will be available here.
        </p>
      </div>
    </AppShell>
  );
}