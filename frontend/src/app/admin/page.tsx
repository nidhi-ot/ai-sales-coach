"use client";

import { useTranslations } from "next-intl";
import { Suspense, useEffect, useMemo, useState } from "react";
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

const scenarios = ["cold_call", "hot_call", "directsales", "meeting"] as const;

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminLoadingFallback() {
  const t = useTranslations("Admin");
  return <div>{t("loading")}</div>;
}

function AdminPageContent()  {
  const t = useTranslations("Admin");
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
        throw new Error(t("errors.loadBusiness", { status: response.status }));
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
        error instanceof Error ? error.message : t("errors.loadBusinessFallback")
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
        throw new Error(data.detail || t("errors.saveBusiness"));
      }

      setBusinessName(data.name ?? "");
      setProducts(data.products ?? "");
      setIcp(data.icp ?? "");
      setObjections(data.objections ?? "");
      setLanguage(data.language ?? "en");
      setFramework(data.framework ?? "");
      setFrameworkWarning(data.framework_warning ?? "");
      setProfileSuccess(t("success.businessSaved"));
    } catch (error) {
      console.error(error);
      setProfileError(
        error instanceof Error ? error.message : t("errors.saveBusinessFallback")
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
        throw new Error(t("errors.loadScenarios", { status: response.status }));
      }

      const data = (await response.json()) as ScenarioConfig[];
      setScenarioConfigs(data);
    } catch (error) {
      console.error(error);
      setScenarioError(
        error instanceof Error ? error.message : t("errors.loadScenariosFallback")
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
        throw new Error(data.detail || t("errors.saveScenario"));
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

      setScenarioSuccess(t("success.scenarioSaved"));
    } catch (error) {
      console.error(error);
      setScenarioError(
        error instanceof Error ? error.message : t("errors.saveScenarioFallback")
      );
    } finally {
      setSavingScenario(false);
    }
  }


  async function handleCreateInvite() {
    setInviteError("");
    setInviteResult(null);

    if (!email.trim()) {
      setInviteError(t("errors.emailRequired"));
      return;
    }

    const parsedDays = Number.parseInt(expiresInDays, 10);

    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      setInviteError(t("errors.expiryPositive"));
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
        setInviteError(data.detail || t("errors.inviteFailed"));
        return;
      }

      setInviteResult(data as InviteResponse);
    } catch (inviteError) {
      console.error(inviteError);
      setInviteError(
        inviteError instanceof Error
          ? inviteError.message
          : t("errors.backendConnection")
      );
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <p style={eyebrowStyle}>{t("eyebrow")}</p>
          <h1 style={titleStyle}>{t("title")}</h1>
          <p style={subtitleStyle}>
            {t("subtitle")}
          </p>
          <button
            type="button"
            onClick={() => router.push("/admin/members")}
            style={memberButtonStyle}
          >
            {t("manageMembers")}
          </button>
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
              <strong>{t("tabs.businessProfile")}</strong>
              <small style={tabSmallTextStyle}>{t("tabDescriptions.businessProfile")}</small>
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
              <strong>{t("tabs.scenarioOverrides")}</strong>
              <small style={tabSmallTextStyle}>{t("tabDescriptions.scenarioOverrides")}</small>
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
              <strong>{t("tabs.invites")}</strong>
              <small style={tabSmallTextStyle}>{t("tabDescriptions.invites")}</small>
            </span>
          </button>
        </div>
        {activeTab === "business" && (
          <div style={adminTwoColumnStyle}>
            <section style={businessPanelStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>{t("businessProfile.title")}</h2>
                  <p style={sectionSubtitleStyle}>
                    {t("businessProfile.description")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile || profileLoading}
                  style={saveButtonStyle}
                >
                  💾 {savingProfile ? t("common.saving") : t("common.save")}
                </button>
              </div>

              {profileError && <p style={errorStyle}>{profileError}</p>}
              {profileSuccess && <p style={successStyle}>{profileSuccess}</p>}

              {profileLoading ? (
                <p style={mutedStyle}>{t("businessProfile.loading")}</p>
              ) : (
                <div style={businessFormStackStyle}>
                  <FormField label={t("businessProfile.businessName")}>
                    <input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      style={modernInputStyle}
                    />
                  </FormField>

                  <FormField label={t("businessProfile.productsServices")}>
                    <textarea
                      value={products}
                      onChange={(e) => setProducts(e.target.value)}
                      rows={4}
                      style={modernTextareaStyle}
                      placeholder={t("businessProfile.productsPlaceholder")}
                    />
                  </FormField>

                  <FormField label={t("businessProfile.idealCustomerProfile")}>
                    <textarea
                      value={icp}
                      onChange={(e) => setIcp(e.target.value)}
                      rows={4}
                      style={modernTextareaStyle}
                      placeholder={t("businessProfile.icpPlaceholder")}
                    />
                  </FormField>

                  <FormField label={t("businessProfile.commonObjections")}>
                    <textarea
                      value={objections}
                      onChange={(e) => setObjections(e.target.value)}
                      rows={4}
                      style={modernTextareaStyle}
                      placeholder={t("businessProfile.objectionsPlaceholder")}
                    />
                  </FormField>
                </div>
              )}
            </section>

            <aside style={aiConfigPanelStyle}>
              <div style={aiHeaderStyle}>
                <div style={aiIconStyle}>🤖</div>

                <div>
                  <h2 style={aiTitleStyle}>{t("configuration.title")}</h2>
                  <p style={aiSubtitleStyle}>
                    {t("configuration.description")}
                  </p>
                </div>
              </div>

              <div style={aiSummaryStyle}>
                <ConfigRow
                  label={t("configuration.language")}
                  value={language === "sv" ? t("common.swedish") : t("common.english")}
                />
                <ConfigRow label={t("configuration.framework")} value={framework || t("common.notConfigured")} />
                <ConfigRow label={t("configuration.products")} value={products ? t("common.configured") : t("common.missing")} />
                <ConfigRow
                  label={t("configuration.icp")}
                  value={icp ? t("common.configured") : t("common.missing")}
                  danger={!icp}
                />
                <ConfigRow
                  label={t("configuration.objections")}
                  value={objections ? t("common.configured") : t("common.missing")}
                  danger={!objections}
                />
              </div>

              <div style={frameworkWarningCardStyle}>
                <div style={{ fontSize: "28px" }}>⚠️</div>
                <div>
                  <strong>{t("configuration.warningTitle")}</strong>
                  <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>
                    {t("configuration.warningText")}
                  </p>
                </div>
              </div>

              <FormField label={t("configuration.language")}>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={modernInputStyle}
                >
                  <option value="en">{t("common.english")}</option>
                  <option value="sv">{t("common.swedish")}</option>
                </select>
              </FormField>
            </aside>
          </div>
        )}

        {activeTab === "scenarios" && (
          <section style={scenarioPanelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>{t("scenarioOverrides.title")}</h2>
                <p style={sectionSubtitleStyle}>
                  {t("scenarioOverrides.description")}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveScenario}
                disabled={savingScenario || scenarioLoading}
                style={smallButtonStyle}
              >
                💾 {savingScenario ? t("common.saving") : t("scenarioOverrides.save")}
              </button>
            </div>

            {scenarioError && <p style={errorStyle}>{scenarioError}</p>}
            {scenarioSuccess && <p style={successStyle}>{scenarioSuccess}</p>}

            {scenarioLoading ? (
              <p style={mutedStyle}>{t("scenarioOverrides.loading")}</p>
            ) : (
              <>
                <div style={formGridStyle}>
                  <FormField label={t("scenarioOverrides.scenario")}>
                    <select
                      value={selectedScenario}
                      onChange={(e) => setSelectedScenario(e.target.value)}
                      style={inputStyle}
                    >
                      {scenarios.map((scenario) => (
                        <option key={scenario} value={scenario}>
                          {t(`scenarioOverrides.scenarios.${scenario}`)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label={t("scenarioOverrides.scenarioTitle")}>
                    <input
                      value={scenarioTitle}
                      onChange={(e) => setScenarioTitle(e.target.value)}
                      style={inputStyle}
                      placeholder={t("scenarioOverrides.titlePlaceholder")}
                    />
                  </FormField>

                  <FormField label={t("scenarioOverrides.objective")}>
                    <div style={textareaWrapStyle}>
                      <textarea
                        value={scenarioObjective}
                        onChange={(e) => setScenarioObjective(e.target.value)}
                        rows={6}
                        maxLength={1000}
                        style={textareaStyle}
                        placeholder={t("scenarioOverrides.objectivePlaceholder")}
                      />
                      <span style={charCountStyle}>
                        {scenarioObjective.length} / 1000
                      </span>
                    </div>
                  </FormField>

                  <FormField label={t("scenarioOverrides.personaNotes")}>
                    <div style={textareaWrapStyle}>
                      <textarea
                        value={personaNotes}
                        onChange={(e) => setPersonaNotes(e.target.value)}
                        rows={6}
                        maxLength={1000}
                        style={textareaStyle}
                        placeholder={t("scenarioOverrides.personaPlaceholder")}
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
                    <strong>{t("scenarioOverrides.whyTitle")}</strong>
                    <p style={helperTextStyle}>
                      {t("scenarioOverrides.whyText")}
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
              <h2 style={sectionTitleStyle}>{t("invites.createTitle")}</h2>
              <p style={sectionSubtitleStyle}>
                {t("invites.createDescription")}
              </p>

              <label style={labelStyle}>{t("invites.email")}</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("invites.emailPlaceholder")}
                type="email"
                style={inputStyle}
              />

              <label style={labelStyle}>{t("invites.role")}</label>
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "rep" | "manager" | "admin")
                }
                style={inputStyle}
              >
                <option value="rep">{t("roles.rep")}</option>
                <option value="manager">{t("roles.manager")}</option>
                <option value="admin">{t("roles.admin")}</option>
              </select>

              <label style={labelStyle}>{t("invites.expiresInDays")}</label>
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
                {inviteLoading ? t("invites.creating") : t("invites.createButton")}
              </button>
            </section>

            <section style={panelStyle}>
              <h2 style={sectionTitleStyle}>{t("invites.detailsTitle")}</h2>

              {!inviteResult ? (
                <p style={mutedStyle}>
                  {t("invites.empty")}
                </p>
              ) : (
                <div style={{ display: "grid", gap: "14px", marginTop: "16px" }}>
                  <InfoRow label={t("invites.email")} value={inviteResult.email} />
                  <InfoRow label={t("invites.role")} value={t(`roles.${inviteResult.role}`)} />
                  <InfoRow label={t("invites.expires")} value={inviteResult.expires_at} />
                  <InfoRow label={t("invites.inviteId")} value={inviteResult.invite_id || "-"} />

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

const memberButtonStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #b7ddd0",
  background: "white",
  color: "#006b4f",
  fontWeight: 800,
  cursor: "pointer",
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