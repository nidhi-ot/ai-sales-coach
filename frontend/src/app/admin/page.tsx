"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import { API_BASE_URL, authFetch } from "../../lib/api";

type InviteResponse = {
  invite_id: string;
  email: string;
  business_id: string;
  role: "rep" | "manager" | "admin";
  token: string;
  registration_link: string;
  expires_at: string;
  warning: string;
};

type BusinessProfile = {
  business_id: string;
  name: string | null;
  products: string | null;
  icp: string | null;
  objections: string | null;
  language: string | null;
  framework: string | null;
  framework_warning: string;
};

type ScenarioConfig = {
  business_id: string;
  scenario_slug: string;
  title: string | null;
  objective: string | null;
  persona_notes: string | null;
};

const scenarios = [
  { slug: "cold_call", label: "Cold Call" },
  { slug: "hot_call", label: "Hot Call" },
  { slug: "directsales", label: "Direct Sales" },
  { slug: "meeting", label: "Meeting" },
];

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  type AdminTab = "business" | "scenarios" | "invites";

  const tabFromUrl = searchParams.get("tab");

  const initialTab: AdminTab =
  tabFromUrl === "scenarios" || tabFromUrl === "invites" || tabFromUrl === "business"
    ? tabFromUrl
    : "business";

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [products, setProducts] = useState("");
  const [icp, setIcp] = useState("");
  const [objections, setObjections] = useState("");
  const [language, setLanguage] = useState("en");
  const [framework, setFramework] = useState("");
  const [frameworkWarning, setFrameworkWarning] = useState("");

  const [scenarioConfigs, setScenarioConfigs] = useState<ScenarioConfig[]>([]);
  const [selectedScenario, setSelectedScenario] = useState("cold_call");
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [scenarioObjective, setScenarioObjective] = useState("");
  const [personaNotes, setPersonaNotes] = useState("");
  const [scenarioLoading, setScenarioLoading] = useState(true);
  const [savingScenario, setSavingScenario] = useState(false);
  const [scenarioError, setScenarioError] = useState("");
  const [scenarioSuccess, setScenarioSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"rep" | "manager" | "admin">("rep");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);

  useEffect(() => {
  const tab = searchParams.get("tab");

  if (tab === "business" || tab === "scenarios" || tab === "invites") {
    setActiveTab(tab);
  }
}, [searchParams]);

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "rep";

    if (storedRole !== "admin") {
      router.replace("/dashboard");
      return;
    }

    loadBusinessProfile();
    loadScenarioConfigs();
  }, [router]);

  useEffect(() => {
    const config = scenarioConfigs.find(
      (item) => item.scenario_slug === selectedScenario
    );

    setScenarioTitle(config?.title ?? "");
    setScenarioObjective(config?.objective ?? "");
    setPersonaNotes(config?.persona_notes ?? "");
  }, [selectedScenario, scenarioConfigs]);

  const inviteLink = useMemo(
    () => inviteResult?.registration_link ?? "",
    [inviteResult]
  );

  async function loadBusinessProfile() {
    setProfileLoading(true);
    setProfileError("");

    try {
      const response = await authFetch(`${API_BASE_URL}/admin/business`);

      if (!response.ok) {
        throw new Error(`Failed to load business profile (${response.status})`);
      }

      const data = (await response.json()) as BusinessProfile;

      setBusinessName(data.name ?? "");
      setProducts(data.products ?? "");
      setIcp(data.icp ?? "");
      setObjections(data.objections ?? "");
      setLanguage(data.language ?? "en");
      setFramework(data.framework ?? "");
      setFrameworkWarning(data.framework_warning ?? "");
    } catch (error) {
      console.error(error);
      setProfileError(
        error instanceof Error ? error.message : "Could not load business profile"
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await authFetch(`${API_BASE_URL}/admin/business`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: businessName,
          products,
          icp,
          objections,
          language,
        }),
      });

      const data = (await response.json()) as BusinessProfile & { detail?: string };

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save business profile");
      }

      setBusinessName(data.name ?? "");
      setProducts(data.products ?? "");
      setIcp(data.icp ?? "");
      setObjections(data.objections ?? "");
      setLanguage(data.language ?? "en");
      setFramework(data.framework ?? "");
      setFrameworkWarning(data.framework_warning ?? "");
      setProfileSuccess("Business profile saved successfully.");
    } catch (error) {
      console.error(error);
      setProfileError(
        error instanceof Error ? error.message : "Could not save business profile"
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function loadScenarioConfigs() {
    setScenarioLoading(true);
    setScenarioError("");

    try {
      const response = await authFetch(`${API_BASE_URL}/admin/scenario-configs`);

      if (!response.ok) {
        throw new Error(`Failed to load scenario configs (${response.status})`);
      }

      const data = (await response.json()) as ScenarioConfig[];
      setScenarioConfigs(data);
    } catch (error) {
      console.error(error);
      setScenarioError(
        error instanceof Error ? error.message : "Could not load scenario configs"
      );
    } finally {
      setScenarioLoading(false);
    }
  }

  async function handleSaveScenario() {
    setSavingScenario(true);
    setScenarioError("");
    setScenarioSuccess("");

    try {
      const response = await authFetch(
        `${API_BASE_URL}/admin/scenario-configs/${selectedScenario}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: scenarioTitle,
            objective: scenarioObjective,
            persona_notes: personaNotes,
          }),
        }
      );

      const data = (await response.json()) as ScenarioConfig & { detail?: string };

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save scenario config");
      }

      setScenarioConfigs((current) => {
        const exists = current.some(
          (item) => item.scenario_slug === data.scenario_slug
        );

        if (exists) {
          return current.map((item) =>
            item.scenario_slug === data.scenario_slug ? data : item
          );
        }

        return [...current, data];
      });

      setScenarioSuccess("Scenario override saved successfully.");
    } catch (error) {
      console.error(error);
      setScenarioError(
        error instanceof Error ? error.message : "Could not save scenario config"
      );
    } finally {
      setSavingScenario(false);
    }
  }


  async function handleCreateInvite() {
    setInviteError("");
    setInviteResult(null);

    if (!email.trim()) {
      setInviteError("Please enter an email address");
      return;
    }

    const parsedDays = Number.parseInt(expiresInDays, 10);

    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      setInviteError("Expiry must be a positive number of days");
      return;
    }

    setInviteLoading(true);

    try {
      const response = await authFetch(`${API_BASE_URL}/admin/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          role: inviteRole,
          expires_in_days: parsedDays,
        }),
      });

      const rawBody = await response.text();
      const data = rawBody
        ? (JSON.parse(rawBody) as Partial<InviteResponse> & { detail?: string })
        : ({} as Partial<InviteResponse> & { detail?: string });

      if (!response.ok) {
        setInviteError(data.detail || "Invite creation failed");
        return;
      }

      setInviteResult(data as InviteResponse);
    } catch (inviteError) {
      console.error(inviteError);
      setInviteError(
        inviteError instanceof Error
          ? inviteError.message
          : "Could not connect to backend"
      );
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <p style={eyebrowStyle}>Admin Console</p>
          <h1 style={titleStyle}>Business AI Configuration</h1>
          <p style={subtitleStyle}>
            Manage your business profile, scenario overrides, and team invitations.
          </p>
        </section>

        <div style={tabsStyle}>
          <button
            type="button"
            onClick={() => {
            setActiveTab("business");
            router.push("/admin?tab=business");
            }}
            style={{
              ...adminTabCardStyle,
              ...(activeTab === "business" ? activeAdminTabCardStyle : {}),
            }}
          >
            <span style={tabIconBoxStyle}>🏢</span>
            <span style={tabTextStyle}>
              <strong>Business Profile</strong>
              <small style={tabSmallTextStyle}>Company context</small>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
  setActiveTab("scenarios");
  router.push("/admin?tab=scenarios");
}}
            style={{
              ...adminTabCardStyle,
              ...(activeTab === "scenarios" ? activeAdminTabCardStyle : {}),
            }}
          >
            <span style={tabIconBoxStyle}>🎭</span>
            <span style={tabTextStyle}>
              <strong>Scenario Overrides</strong>
              <small style={tabSmallTextStyle}>AI persona behavior</small>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
  setActiveTab("invites");
  router.push("/admin?tab=invites");
}}
            style={{
              ...adminTabCardStyle,
              ...(activeTab === "invites" ? activeAdminTabCardStyle : {}),
            }}
          >
            <span style={tabIconBoxStyle}>👥</span>
            <span style={tabTextStyle}>
              <strong>Invites</strong>
              <small style={tabSmallTextStyle}>Team access</small>
            </span>
          </button>
        </div>
        {activeTab === "business" && (
          <div style={adminTwoColumnStyle}>
            <section style={businessPanelStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Business Profile</h2>
                  <p style={sectionSubtitleStyle}>
                    Configure the company context used by future AI practice calls.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile || profileLoading}
                  style={saveButtonStyle}
                >
                  💾 {savingProfile ? "Saving..." : "Save"}
                </button>
              </div>

              {profileError && <p style={errorStyle}>{profileError}</p>}
              {profileSuccess && <p style={successStyle}>{profileSuccess}</p>}

              {profileLoading ? (
                <p style={mutedStyle}>Loading business profile...</p>
              ) : (
                <div style={businessFormStackStyle}>
                  <FormField label="Business Name">
                    <input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      style={modernInputStyle}
                    />
                  </FormField>

                  <FormField label="Products / Services">
                    <textarea
                      value={products}
                      onChange={(e) => setProducts(e.target.value)}
                      rows={4}
                      style={modernTextareaStyle}
                      placeholder="Describe what your business sells..."
                    />
                  </FormField>

                  <FormField label="Ideal Customer Profile">
                    <textarea
                      value={icp}
                      onChange={(e) => setIcp(e.target.value)}
                      rows={4}
                      style={modernTextareaStyle}
                      placeholder="Describe your target customers..."
                    />
                  </FormField>

                  <FormField label="Common Objections">
                    <textarea
                      value={objections}
                      onChange={(e) => setObjections(e.target.value)}
                      rows={4}
                      style={modernTextareaStyle}
                      placeholder="Example: too expensive, no time, already have a tool..."
                    />
                  </FormField>
                </div>
              )}
            </section>

            <aside style={aiConfigPanelStyle}>
              <div style={aiHeaderStyle}>
                <div style={aiIconStyle}>🤖</div>

                <div>
                  <h2 style={aiTitleStyle}>AI Configuration</h2>
                  <p style={aiSubtitleStyle}>
                    These settings control how the AI customer behaves in future
                    practice sessions.
                  </p>
                </div>
              </div>

              <div style={aiSummaryStyle}>
                <ConfigRow
                  label="Language"
                  value={language === "sv" ? "Swedish" : "English"}
                />
                <ConfigRow label="Framework" value={framework || "Not configured"} />
                <ConfigRow label="Products" value={products ? "Configured" : "Missing"} />
                <ConfigRow
                  label="ICP"
                  value={icp ? "Configured" : "Missing"}
                  danger={!icp}
                />
                <ConfigRow
                  label="Objections"
                  value={objections ? "Configured" : "Missing"}
                  danger={!objections}
                />
              </div>

              <div style={frameworkWarningCardStyle}>
                <div style={{ fontSize: "28px" }}>⚠️</div>
                <div>
                  <strong>Framework Warning</strong>
                  <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>
                    {frameworkWarning}
                  </p>
                </div>
              </div>

              <FormField label="Language">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={modernInputStyle}
                >
                  <option value="en">English</option>
                  <option value="sv">Swedish</option>
                </select>
              </FormField>
            </aside>
          </div>
        )}

        {activeTab === "scenarios" && (
          <section style={scenarioPanelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Scenario Overrides</h2>
                <p style={sectionSubtitleStyle}>
                  Override the default scenario title, objective, and persona notes
                  for your business.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveScenario}
                disabled={savingScenario || scenarioLoading}
                style={smallButtonStyle}
              >
                💾 {savingScenario ? "Saving..." : "Save Scenario"}
              </button>
            </div>

            {scenarioError && <p style={errorStyle}>{scenarioError}</p>}
            {scenarioSuccess && <p style={successStyle}>{scenarioSuccess}</p>}

            {scenarioLoading ? (
              <p style={mutedStyle}>Loading scenario configs...</p>
            ) : (
              <>
                <div style={formGridStyle}>
                  <FormField label="Scenario">
                    <select
                      value={selectedScenario}
                      onChange={(e) => setSelectedScenario(e.target.value)}
                      style={inputStyle}
                    >
                      {scenarios.map((scenario) => (
                        <option key={scenario.slug} value={scenario.slug}>
                          {scenario.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Scenario Title">
                    <input
                      value={scenarioTitle}
                      onChange={(e) => setScenarioTitle(e.target.value)}
                      style={inputStyle}
                      placeholder="Example: Cold Call Practice"
                    />
                  </FormField>

                  <FormField label="Objective">
                    <div style={textareaWrapStyle}>
                      <textarea
                        value={scenarioObjective}
                        onChange={(e) => setScenarioObjective(e.target.value)}
                        rows={6}
                        maxLength={1000}
                        style={textareaStyle}
                        placeholder="What should the rep achieve in this scenario?"
                      />
                      <span style={charCountStyle}>
                        {scenarioObjective.length} / 1000
                      </span>
                    </div>
                  </FormField>

                  <FormField label="Persona Notes">
                    <div style={textareaWrapStyle}>
                      <textarea
                        value={personaNotes}
                        onChange={(e) => setPersonaNotes(e.target.value)}
                        rows={6}
                        maxLength={1000}
                        style={textareaStyle}
                        placeholder="How should the AI customer behave?"
                      />
                      <span style={charCountStyle}>
                        {personaNotes.length} / 1000
                      </span>
                    </div>
                  </FormField>
                </div>

                <div style={helperBannerStyle}>
                  <div style={helperIconStyle}>💡</div>
                  <div>
                    <strong>Why override scenarios?</strong>
                    <p style={helperTextStyle}>
                      Overrides help tailor the AI customer&apos;s behavior to match
                      your sales motion and common real-world objections.
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "invites" && (
          <div style={gridStyle}>
            <section style={panelStyle}>
              <h2 style={sectionTitleStyle}>Create Invite</h2>
              <p style={sectionSubtitleStyle}>
                Create invite links for reps, managers, and admins in your business.
              </p>

              <label style={labelStyle}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@company.com"
                type="email"
                style={inputStyle}
              />

              <label style={labelStyle}>Role</label>
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "rep" | "manager" | "admin")
                }
                style={inputStyle}
              >
                <option value="rep">Rep</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>

              <label style={labelStyle}>Invite expires in days</label>
              <input
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                type="number"
                min="1"
                style={inputStyle}
              />

              {inviteError && <p style={errorStyle}>{inviteError}</p>}

              <button
                type="button"
                onClick={handleCreateInvite}
                disabled={inviteLoading}
                style={buttonStyle}
              >
                {inviteLoading ? "Creating..." : "Create Invite"}
              </button>
            </section>

            <section style={panelStyle}>
              <h2 style={sectionTitleStyle}>Invite Details</h2>

              {!inviteResult ? (
                <p style={mutedStyle}>
                  Create an invite to generate a registration link.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "14px", marginTop: "16px" }}>
                  <InfoRow label="Email" value={inviteResult.email} />
                  <InfoRow label="Role" value={inviteResult.role} />
                  <InfoRow label="Expires" value={inviteResult.expires_at} />
                  <InfoRow label="Invite ID" value={inviteResult.invite_id || "-"} />

                  <div style={linkCardStyle}>
                    <div style={{ overflowWrap: "anywhere" }}>{inviteLink}</div>
                  </div>

                  <p style={warningStyle}>{inviteResult.warning}</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ConfigRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div style={configRowStyle}>
      <span>{label}</span>
      <strong style={{ color: danger ? "#dc2626" : "#00704f" }}>
        {value}
      </strong>
    </div>
  );
}
function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRowStyle}>
      <span style={{ color: "#667085", fontSize: "14px" }}>{label}</span>
      <strong style={{ color: "#101828" }}>{value}</strong>
    </div>
  );
}

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
  border: "1px solid #dfeee8",
  borderRadius: "28px",
  padding: "34px",
  boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
  marginBottom: "24px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#006b4f",
  fontWeight: 800,
  fontSize: "14px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "36px",
  fontWeight: 900,
  color: "#101828",
};

const subtitleStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "16px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "20px",
};

const panelStyle: React.CSSProperties = {
  background: "white",
  padding: "28px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "flex-start",
  marginBottom: "24px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 800,
  color: "#101828",
};

const sectionSubtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#667085",
  fontSize: "15px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "20px",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  margin: "18px 0 8px",
  fontWeight: 700,
  color: "#344054",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #d0d5dd",
  fontSize: "15px",
  color: "#101828",
  background: "white",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.5,
};

const buttonStyle: React.CSSProperties = {
  marginTop: "22px",
  width: "100%",
  padding: "14px 18px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #006b4f 0%, #008f6b 100%)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(0, 107, 79, 0.2)",
};

const smallButtonStyle: React.CSSProperties = {
  padding: "13px 20px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #006b4f 0%, #008f6b 100%)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const errorStyle: React.CSSProperties = {
  color: "#b42318",
  background: "#fef3f2",
  border: "1px solid #fecdca",
  padding: "12px 14px",
  borderRadius: "12px",
  fontSize: "14px",
  marginTop: "18px",
};

const successStyle: React.CSSProperties = {
  color: "#027a48",
  background: "#ecfdf3",
  border: "1px solid #abefc6",
  padding: "12px 14px",
  borderRadius: "12px",
  fontSize: "14px",
  marginTop: "18px",
};

const mutedStyle: React.CSSProperties = {
  color: "#667085",
  marginTop: "16px",
};

const infoRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#f9fafb",
  border: "1px solid #eef2f6",
};

const linkCardStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: "14px",
  background: "#ecfdf3",
  border: "1px solid #abefc6",
  color: "#027a48",
  fontSize: "14px",
};

const warningStyle: React.CSSProperties = {
  margin: 0,
  color: "#b54708",
  background: "#fffaeb",
  border: "1px solid #fedf89",
  borderRadius: "12px",
  padding: "12px 14px",
};

const adminTwoColumnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  gap: "24px",
};

const tabsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "18px",
  marginBottom: "24px",
};

const adminTabCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  borderRadius: "18px",
  padding: "20px 24px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 12px 30px rgba(16, 24, 40, 0.05)",
};

const activeAdminTabCardStyle: React.CSSProperties = {
  borderColor: "#00704f",
  boxShadow: "0 14px 34px rgba(0, 112, 79, 0.14)",
};

const tabIconBoxStyle: React.CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "16px",
  background: "#edf8f3",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "25px",
};

const scenarioPanelStyle: React.CSSProperties = {
  background: "#ffffff",
  padding: "30px",
  borderRadius: "26px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 50px rgba(16, 24, 40, 0.07)",
};

const textareaWrapStyle: React.CSSProperties = {
  position: "relative",
};

const charCountStyle: React.CSSProperties = {
  position: "absolute",
  right: "14px",
  bottom: "12px",
  color: "#00704f",
  fontSize: "13px",
  fontWeight: 800,
};

const helperBannerStyle: React.CSSProperties = {
  marginTop: "28px",
  padding: "20px",
  borderRadius: "18px",
  border: "1px solid #cfeee1",
  background: "linear-gradient(135deg, #f0faf6 0%, #ffffff 100%)",
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const helperIconStyle: React.CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "999px",
  background: "#dff5ea",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
};

const helperTextStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#667085",
};

const businessPanelStyle: React.CSSProperties = {
  background: "#ffffff",
  padding: "32px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 50px rgba(16, 24, 40, 0.07)",
};

const businessFormStackStyle: React.CSSProperties = {
  display: "grid",
  gap: "22px",
};

const modernInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px 18px",
  borderRadius: "14px",
  border: "1px solid #cfd8e3",
  fontSize: "15px",
  color: "#101828",
  background: "#ffffff",
};

const modernTextareaStyle: React.CSSProperties = {
  ...modernInputStyle,
  resize: "vertical",
  lineHeight: 1.6,
};

const saveButtonStyle: React.CSSProperties = {
  padding: "14px 24px",
  borderRadius: "14px",
  border: "none",
  background: "#00704f",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(0, 112, 79, 0.22)",
};

const aiConfigPanelStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 18px 50px rgba(16, 24, 40, 0.07)",
  alignSelf: "start",
};

const aiHeaderStyle: React.CSSProperties = {
  display: "flex",
  gap: "16px",
  marginBottom: "28px",
};

const aiIconStyle: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "18px",
  background: "#dff5ea",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
};

const aiTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 900,
  color: "#101828",
};

const aiSubtitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
  lineHeight: 1.5,
};

const aiSummaryStyle: React.CSSProperties = {
  display: "grid",
  gap: "0",
  marginBottom: "24px",
};

const configRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "14px 0",
  borderBottom: "1px dashed #d0d5dd",
  color: "#344054",
};

const frameworkWarningCardStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  padding: "18px",
  borderRadius: "16px",
  border: "1px solid #facc15",
  background: "#fffbeb",
  color: "#92400e",
  marginBottom: "24px",
};

const tabTextStyle: React.CSSProperties = {
  display: "grid",
  gap: "4px",
};

const tabSmallTextStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "13px",
  fontWeight: 500,
};
