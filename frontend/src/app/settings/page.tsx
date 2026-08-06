"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import AppShell from "../../components/AppShell";

type UserSettings = {
  language: string;
  difficulty: string;
  coachingStyle: string;
  feedbackTiming: string;
  theme: string;
  accentColor: string;
  fontSize: string;
  layoutDensity: string;
  practiceReminders: boolean;
  scorecardNotifications: boolean;
  weeklyProgressSummary: boolean;
  achievementAlerts: boolean;
  weeklyTeamReport: boolean;
  coachingAlerts: boolean;
  inactiveRepReminders: boolean;
  newScorecardNotifications: boolean;
  defaultDashboard: string;
  reportFrequency: string;
  coachingAlertLevel: string;
  defaultTeamFilter: string;
};

type SelectOption = {
  value: string;
  label: string;
};

const defaultSettings: UserSettings = {
  language: "English",
  difficulty: "Intermediate",
  coachingStyle: "Balanced",
  feedbackTiming: "After call",
  theme: "Light",
  accentColor: "Emerald Green",
  fontSize: "Medium",
  layoutDensity: "Comfortable",
  practiceReminders: true,
  scorecardNotifications: true,
  weeklyProgressSummary: false,
  achievementAlerts: true,
  weeklyTeamReport: true,
  coachingAlerts: true,
  inactiveRepReminders: true,
  newScorecardNotifications: false,
  defaultDashboard: "Manager Dashboard",
  reportFrequency: "Weekly",
  coachingAlertLevel: "Medium",
  defaultTeamFilter: "All reps",
};

const optionTranslationKeys: Record<string, string> = {
  English: "english",
  Swedish: "swedish",
  Beginner: "beginner",
  Intermediate: "intermediate",
  Advanced: "advanced",
  Balanced: "balanced",
  Detailed: "detailed",
  Strict: "strict",
  "After call": "afterCall",
  "Real-time": "realTime",
  Both: "both",
  Light: "light",
  System: "system",
  Dark: "dark",
  "Emerald Green": "emeraldGreen",
  Blue: "blue",
  Purple: "purple",
  Small: "small",
  Medium: "medium",
  Large: "large",
  Comfortable: "comfortable",
  Compact: "compact",
  "Manager Dashboard": "managerDashboard",
  "Team Dashboard": "teamDashboard",
  Daily: "daily",
  Weekly: "weekly",
  Monthly: "monthly",
  Low: "low",
  High: "high",
  "All reps": "allReps",
  "Needs coaching": "needsCoaching",
  "Active this week": "activeThisWeek",
};

function getOptionLabel(
  t: ReturnType<typeof useTranslations>,
  value: string
) {
  const optionKey = optionTranslationKeys[value];

  return optionKey ? t(`options.${optionKey}`) : value;
}

function buildOptions(
  t: ReturnType<typeof useTranslations>,
  values: string[]
): SelectOption[] {
  return values.map((value) => ({
    value,
    label: getOptionLabel(t, value),
  }));
}

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const [role, setRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("user@example.com");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  function getSettingsStorageKey() {
    const userId = localStorage.getItem("user_id");
    const email = localStorage.getItem("email");

    return `user_settings:${userId ?? email ?? "anonymous"}`;
  }

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setFullName(localStorage.getItem("full_name") || t("fallbackUser"));
    setEmail(localStorage.getItem("email") || "user@example.com");

    const settingsKey = getSettingsStorageKey();
    const savedSettings = localStorage.getItem(settingsKey);

    if (savedSettings) {
      try {
        setSettings({
          ...defaultSettings,
          ...JSON.parse(savedSettings),
        });
      } catch {
        localStorage.removeItem(settingsKey);
        setSettings(defaultSettings);
      }
    }
  }, [t]);

  function updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSave() {
    localStorage.setItem(getSettingsStorageKey(), JSON.stringify(settings));
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  const displayName = fullName || t("fallbackUser");
  const displayRole =
    role === "admin"
      ? t("roles.admin")
      : role === "manager"
        ? t("roles.manager")
        : t("roles.rep");

  return (
    <AppShell>
      <main style={pageStyle}>
        <section style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>
              {role === "manager" ? t("managerEyebrow") : t("eyebrow")}
            </p>

            <h1 style={titleStyle}>{t("title")}</h1>

            <p style={subtitleStyle}>
              {role === "manager"
                ? t("managerSubtitle")
                : t("subtitle")}
            </p>
          </div>

          <button type="button" onClick={handleSave} style={saveButtonStyle}>
            {t("saveChanges")}
          </button>
        </section>

        {saved && <div style={successStyle}>{t("saved")}</div>}

        <section style={layoutStyle}>
          <div style={mainColumnStyle}>
            <SettingsCard title={t("sections.account")} icon="👤">
              <div style={formGridStyle}>
                <Field label={t("fields.fullName")} value={displayName} />
                <Field label={t("fields.email")} value={email} />
                <Field label={t("fields.role")} value={displayRole} />
                <Field
                  label={t("fields.organization")}
                  value="Optimal Trappstädning"
                />
              </div>
            </SettingsCard>

            {role === "admin" ? (
              <AdminSettings />
            ) : role === "manager" ? (
              <ManagerSettings settings={settings} updateSetting={updateSetting} />
            ) : (
               <RepSettings settings={settings} updateSetting={updateSetting} />
            )}

            <SettingsCard title={t("sections.appearance")} icon="🎨">
              <div style={formGridStyle}>
                <SelectField
                  label={t("fields.theme")}
                  options={buildOptions(t, ["Light", "System", "Dark"])}
                  value={settings.theme}
                  onChange={(value) => updateSetting("theme", value)}
                />

                <SelectField
                  label={t("fields.accentColor")}
                  options={buildOptions(t, ["Emerald Green", "Blue", "Purple"])}
                  value={settings.accentColor}
                  onChange={(value) => updateSetting("accentColor", value)}
                />

                <SelectField
                  label={t("fields.fontSize")}
                  options={buildOptions(t, ["Small", "Medium", "Large"])}
                  value={settings.fontSize}
                  onChange={(value) => updateSetting("fontSize", value)}
                />

                <SelectField
                  label={t("fields.layoutDensity")}
                  options={buildOptions(t, ["Comfortable", "Compact"])}
                  value={settings.layoutDensity}
                  onChange={(value) => updateSetting("layoutDensity", value)}
                />
              </div>
            </SettingsCard>

            <SettingsCard title={t("sections.security")} icon="🔐">
              <p style={mutedTextStyle}>
                {t("securityDescription")}
              </p>

              <button type="button" style={secondaryButtonStyle}>
                {t("changePassword")}
              </button>
            </SettingsCard>
          </div>

          <aside style={sidePanelStyle}>
            <div style={profileCardStyle}>
              <div style={avatarStyle}>{getInitials(displayName)}</div>
              <h2 style={profileNameStyle}>{displayName}</h2>
              <p style={profileRoleStyle}>{displayRole}</p>
            </div>

            <div style={summaryCardStyle}>
              <h3 style={sideTitleStyle}>{t("currentSetup")}</h3>
              <SummaryRow
                label={t("fields.language")}
                value={getOptionLabel(t, settings.language)}
              />
              <SummaryRow
                label={t("fields.theme")}
                value={getOptionLabel(t, settings.theme)}
              />
              <SummaryRow
                label={t("fields.notifications")}
                value={
                  role === "manager"
                    ? t("summary.teamAlerts")
                    : t("summary.practiceAlerts")
                }
              />
              <SummaryRow
                label={t("fields.dashboard")}
                value={
                  role === "manager"
                    ? getOptionLabel(t, settings.defaultDashboard)
                    : t("summary.repView")
                }
              />
            </div>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}
function AdminSettings() {
  const t = useTranslations("Settings");

  return (
    <SettingsCard title={t("sections.adminWorkspace")} icon="🛠️">
      <p style={mutedTextStyle}>
        {t("adminWorkspaceDescription")}
      </p>
    </SettingsCard>
  );
}

function RepSettings({
  settings,
  updateSetting,
}: {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
}) {
  const t = useTranslations("Settings");

  return (
    <>
      <SettingsCard title={t("sections.aiCoachPreferences")} icon="🤖">
        <div style={formGridStyle}>
          <SelectField
            label={t("fields.preferredLanguage")}
            options={buildOptions(t, ["English", "Swedish"])}
            value={settings.language}
            onChange={(value) => updateSetting("language", value)}
          />

          <SelectField
            label={t("fields.defaultDifficulty")}
            options={buildOptions(t, ["Beginner", "Intermediate", "Advanced"])}
            value={settings.difficulty}
            onChange={(value) => updateSetting("difficulty", value)}
          />

          <SelectField
            label={t("fields.coachingStyle")}
            options={buildOptions(t, ["Balanced", "Detailed", "Strict"])}
            value={settings.coachingStyle}
            onChange={(value) => updateSetting("coachingStyle", value)}
          />

          <SelectField
            label={t("fields.feedbackTiming")}
            options={buildOptions(t, ["After call", "Real-time", "Both"])}
            value={settings.feedbackTiming}
            onChange={(value) => updateSetting("feedbackTiming", value)}
          />
        </div>
      </SettingsCard>

      <SettingsCard title={t("sections.notifications")} icon="🔔">
        <ToggleRow
          label={t("toggles.practiceReminders")}
          checked={settings.practiceReminders}
          onChange={(value) => updateSetting("practiceReminders", value)}
        />
        <ToggleRow
          label={t("toggles.scorecardNotifications")}
          checked={settings.scorecardNotifications}
          onChange={(value) => updateSetting("scorecardNotifications", value)}
        />
        <ToggleRow
          label={t("toggles.weeklyProgressSummary")}
          checked={settings.weeklyProgressSummary}
          onChange={(value) => updateSetting("weeklyProgressSummary", value)}
        />
        <ToggleRow
          label={t("toggles.achievementAlerts")}
          checked={settings.achievementAlerts}
          onChange={(value) => updateSetting("achievementAlerts", value)}
        />
      </SettingsCard>
    </>
  );
}

function ManagerSettings({
  settings,
  updateSetting,
}: {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
}) {
  const t = useTranslations("Settings");

  return (
    <>
      <SettingsCard title={t("sections.managerNotifications")} icon="🔔">
        <ToggleRow
          label={t("toggles.weeklyTeamReport")}
          checked={settings.weeklyTeamReport}
          onChange={(value) => updateSetting("weeklyTeamReport", value)}
        />
        <ToggleRow
          label={t("toggles.coachingAlerts")}
          checked={settings.coachingAlerts}
          onChange={(value) => updateSetting("coachingAlerts", value)}
        />
        <ToggleRow
          label={t("toggles.inactiveRepReminders")}
          checked={settings.inactiveRepReminders}
          onChange={(value) => updateSetting("inactiveRepReminders", value)}
        />
        <ToggleRow
          label={t("toggles.newScorecardNotifications")}
          checked={settings.newScorecardNotifications}
          onChange={(value) => updateSetting("newScorecardNotifications", value)}
        />
      </SettingsCard>

      <SettingsCard title={t("sections.dashboardPreferences")} icon="📊">
        <div style={formGridStyle}>
          <SelectField
            label={t("fields.defaultDashboard")}
            options={buildOptions(t, ["Manager Dashboard", "Team Dashboard"])}
            value={settings.defaultDashboard}
            onChange={(value) => updateSetting("defaultDashboard", value)}
          />

          <SelectField
            label={t("fields.reportFrequency")}
            options={buildOptions(t, ["Daily", "Weekly", "Monthly"])}
            value={settings.reportFrequency}
            onChange={(value) => updateSetting("reportFrequency", value)}
          />

          <SelectField
            label={t("fields.coachingAlertLevel")}
            options={buildOptions(t, ["Low", "Medium", "High"])}
            value={settings.coachingAlertLevel}
            onChange={(value) => updateSetting("coachingAlertLevel", value)}
          />

          <SelectField
            label={t("fields.defaultTeamFilter")}
            options={buildOptions(t, [
              "All reps",
              "Needs coaching",
              "Active this week",
            ])}
            value={settings.defaultTeamFilter}
            onChange={(value) => updateSetting("defaultTeamFilter", value)}
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
  value,
  onChange,
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div style={toggleRowStyle}>
      <span>{label}</span>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          ...switchTrackStyle,
          background: checked ? "#00704f" : "#d0d5dd",
          justifyContent: checked ? "flex-end" : "flex-start",
        }}
      >
        <span style={switchDotStyle} />
      </button>
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

const switchTrackStyle: React.CSSProperties = {
  width: "48px",
  height: "26px",
  borderRadius: "999px",
  border: "none",
  padding: "3px",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
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
