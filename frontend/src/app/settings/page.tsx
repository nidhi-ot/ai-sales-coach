"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

export default function SettingsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState("User");
  const [email, setEmail] = useState("user@example.com");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setFullName(localStorage.getItem("full_name") || "User");
    setEmail(localStorage.getItem("email") || "user@example.com");
  }, []);

  function handleSave() {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <AppShell>
      <main style={pageStyle}>
        <section style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>
              {role === "manager" ? "Manager Settings" : "Settings"}
            </p>

            <h1 style={titleStyle}>Manage Preferences</h1>

            <p style={subtitleStyle}>
              {role === "manager"
                ? "Manage dashboard preferences, coaching alerts, and team notifications."
                : "Manage your account, AI coach preferences, notifications, and appearance."}
            </p>
          </div>

          <button type="button" onClick={handleSave} style={saveButtonStyle}>
            Save Changes
          </button>
        </section>

        {saved && (
          <div style={successStyle}>Settings saved successfully.</div>
        )}

        <section style={layoutStyle}>
          <div style={mainColumnStyle}>
            <SettingsCard title="Account" icon="👤">
              <div style={formGridStyle}>
                <Field label="Full Name" value={fullName} />
                <Field label="Email" value={email} />
                <Field
                  label="Role"
                  value={role === "manager" ? "Manager" : "Sales Representative"}
                />
                <Field label="Organization" value="Optimal Trappstädning" />
              </div>
            </SettingsCard>

            {role === "manager" ? <ManagerSettings /> : <RepSettings />}

            <SettingsCard title="Appearance" icon="🎨">
              <div style={formGridStyle}>
                <SelectField
                  label="Theme"
                  options={["Light", "System", "Dark"]}
                  defaultValue="Light"
                />

                <SelectField
                  label="Accent Color"
                  options={["Emerald Green", "Blue", "Purple"]}
                  defaultValue="Emerald Green"
                />

                <SelectField
                  label="Font Size"
                  options={["Small", "Medium", "Large"]}
                  defaultValue="Medium"
                />

                <SelectField
                  label="Layout Density"
                  options={["Comfortable", "Compact"]}
                  defaultValue="Comfortable"
                />
              </div>
            </SettingsCard>

            <SettingsCard title="Security" icon="🔐">
              <p style={mutedTextStyle}>
                Update your password and manage account security.
              </p>

              <button type="button" style={secondaryButtonStyle}>
                Change Password
              </button>
            </SettingsCard>
          </div>

          <aside style={sidePanelStyle}>
            <div style={profileCardStyle}>
              <div style={avatarStyle}>
                {getInitials(fullName)}
              </div>

              <h2 style={profileNameStyle}>{fullName}</h2>

              <p style={profileRoleStyle}>
                {role === "manager" ? "Manager" : "Sales Representative"}
              </p>
            </div>

            <div style={summaryCardStyle}>
              <h3 style={sideTitleStyle}>Current Setup</h3>

              <SummaryRow label="Language" value="English" />
              <SummaryRow label="Theme" value="Light" />
              <SummaryRow
                label="Notifications"
                value={role === "manager" ? "Team alerts" : "Practice alerts"}
              />
              <SummaryRow
                label="Dashboard"
                value={role === "manager" ? "Manager view" : "Rep view"}
              />
            </div>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}

function RepSettings() {
  return (
    <>
      <SettingsCard title="AI Coach Preferences" icon="🤖">
        <div style={formGridStyle}>
          <SelectField
            label="Preferred Language"
            options={["English", "Swedish"]}
            defaultValue="English"
          />

          <SelectField
            label="Default Difficulty"
            options={["Beginner", "Intermediate", "Advanced"]}
            defaultValue="Intermediate"
          />

          <SelectField
            label="Coaching Style"
            options={["Balanced", "Detailed", "Strict"]}
            defaultValue="Balanced"
          />

          <SelectField
            label="Feedback Timing"
            options={["After call", "Real-time", "Both"]}
            defaultValue="After call"
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Notifications" icon="🔔">
        <ToggleRow label="Practice reminders" defaultChecked />
        <ToggleRow label="Scorecard notifications" defaultChecked />
        <ToggleRow label="Weekly progress summary" />
        <ToggleRow label="Achievement alerts" defaultChecked />
      </SettingsCard>
    </>
  );
}

function ManagerSettings() {
  return (
    <>
      <SettingsCard title="Manager Notifications" icon="🔔">
        <ToggleRow label="Weekly team report" defaultChecked />
        <ToggleRow label="Coaching alerts" defaultChecked />
        <ToggleRow label="Inactive rep reminders" defaultChecked />
        <ToggleRow label="New scorecard notifications" />
      </SettingsCard>

      <SettingsCard title="Dashboard Preferences" icon="📊">
        <div style={formGridStyle}>
          <SelectField
            label="Default Dashboard"
            options={["Manager Dashboard", "Team Dashboard"]}
            defaultValue="Manager Dashboard"
          />

          <SelectField
            label="Report Frequency"
            options={["Daily", "Weekly", "Monthly"]}
            defaultValue="Weekly"
          />

          <SelectField
            label="Coaching Alert Level"
            options={["Low", "Medium", "High"]}
            defaultValue="Medium"
          />

          <SelectField
            label="Default Team Filter"
            options={["All reps", "Needs coaching", "Active this week"]}
            defaultValue="All reps"
          />
        </div>
      </SettingsCard>
    </>
  );
}

function SettingsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={iconStyle}>{icon}</div>
        <h2 style={cardTitleStyle}>{title}</h2>
      </div>

      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input value={value} readOnly style={inputStyle} />
    </label>
  );
}

function SelectField({
  label,
  options,
  defaultValue,
}: {
  label: string;
  options: string[];
  defaultValue: string;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <select defaultValue={defaultValue} style={inputStyle}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({
  label,
  defaultChecked = false,
}: {
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <div style={toggleRowStyle}>
      <span>{label}</span>

      <label style={switchStyle}>
        <input type="checkbox" defaultChecked={defaultChecked} hidden />
        <span style={switchTrackStyle}>
          <span style={switchDotStyle} />
        </span>
      </label>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryRowStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const pageStyle: React.CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "28px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: "#00704f",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0",
  fontSize: "42px",
  fontWeight: 950,
  color: "#101828",
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#667085",
  fontSize: "17px",
};

const saveButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#00704f",
  color: "#ffffff",
  padding: "15px 26px",
  borderRadius: "14px",
  fontWeight: 900,
  cursor: "pointer",
};

const successStyle: React.CSSProperties = {
  background: "#dff5ea",
  color: "#00704f",
  padding: "14px 18px",
  borderRadius: "14px",
  marginBottom: "24px",
  fontWeight: 800,
};

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  gap: "28px",
};

const mainColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: "22px",
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 20px 60px rgba(15,23,42,0.06)",
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "24px",
};

const iconStyle: React.CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "18px",
  background: "#dff5ea",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 900,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "18px",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const labelStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "14px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  borderRadius: "14px",
  padding: "14px 16px",
  fontSize: "15px",
  background: "#f9fafb",
  color: "#101828",
};

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 0",
  borderTop: "1px solid #eef2f7",
  fontWeight: 700,
};

const switchStyle: React.CSSProperties = {
  cursor: "pointer",
};

const switchTrackStyle: React.CSSProperties = {
  width: "48px",
  height: "26px",
  borderRadius: "999px",
  background: "#00704f",
  padding: "3px",
  display: "flex",
  justifyContent: "flex-end",
};

const switchDotStyle: React.CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "999px",
  background: "#ffffff",
};

const mutedTextStyle: React.CSSProperties = {
  color: "#667085",
  lineHeight: 1.6,
};

const secondaryButtonStyle: React.CSSProperties = {
  marginTop: "18px",
  border: "1px solid #00704f",
  background: "#ffffff",
  color: "#00704f",
  padding: "13px 20px",
  borderRadius: "14px",
  fontWeight: 800,
  cursor: "pointer",
};

const sidePanelStyle: React.CSSProperties = {
  display: "grid",
  gap: "20px",
  alignSelf: "start",
  position: "sticky",
  top: "24px",
};

const profileCardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #00704f, #003f32)",
  color: "#ffffff",
  borderRadius: "28px",
  padding: "30px",
  textAlign: "center",
};

const avatarStyle: React.CSSProperties = {
  width: "86px",
  height: "86px",
  borderRadius: "999px",
  background: "#ffffff",
  color: "#00704f",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  fontWeight: 950,
  margin: "0 auto 16px",
};

const profileNameStyle: React.CSSProperties = {
  margin: 0,
};

const profileRoleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "rgba(255,255,255,0.78)",
};

const summaryCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "26px",
  padding: "24px",
};

const sideTitleStyle: React.CSSProperties = {
  marginTop: 0,
  fontSize: "20px",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "13px 0",
  borderTop: "1px solid #eef2f7",
  color: "#667085",
};