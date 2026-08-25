"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import AppShell from "../../components/AppShell";
import { API_BASE_URL, authFetch } from "../../lib/api";

type ScenarioStatus = {
  has_history: boolean;
  scenario: string;
  version: number | null;
  weakest_dimension: string | null;
  metric_scores?: Record<string, number> | null;
};

type BusinessContextResponse = {
  business_name?: string;
};

const focusAreas = [
  {
    id: "discovery",
    metricKey: "discovery",
    titleKey: "focusAreas.discovery",
    icon: "🔍",
  },
  {
    id: "handling_objections",
    metricKey: "objection_handling",
    titleKey: "focusAreas.handlingObjections",
    icon: "🛡️",
  },
  {
    id: "value_proposition",
    metricKey: "rapport",
    titleKey: "focusAreas.valueProposition",
    icon: "💡",
  },
  {
    id: "closing",
    metricKey: "closing",
    titleKey: "focusAreas.closing",
    icon: "🏆",
  },
];

const scenarioTitleKeys: Record<string, string> = {
  cold_call: "scenarioNames.coldCall",
  hot_call: "scenarioNames.hotCall",
  direct_sales: "scenarioNames.directSales",
  directsales: "scenarioNames.directSales",
  meeting: "scenarioNames.meeting",
};

function mapWeakestDimensionToFocusArea(
  value: string | null | undefined
) {
  switch (value) {
    case "rapport":
      return "value_proposition";
    case "discovery":
      return "discovery";
    case "objection_handling":
      return "handling_objections";
    case "closing":
      return "closing";
    default:
      return null;
  }
}

function scoreToPercent(score: number | undefined) {
  if (typeof score !== "number") {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score * 10)));
}

export default function PracticeSetupPage() {
  const router = useRouter();
  const t = useTranslations("PracticeSetup");

  const [scenario, setScenario] = useState("cold_call");
  const [focusArea, setFocusArea] = useState("discovery");

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [scenarioStatus, setScenarioStatus] =
    useState<ScenarioStatus | null>(null);

  const [loadingStatus, setLoadingStatus] = useState(true);

  /*
   * Keep this temporarily because the Call page currently
   * expects business_context in the query string.
   * It is no longer shown to the user.
   */
  const businessContext = "apartment_association";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const selectedScenario =
      params.get("scenario") || "cold_call";

    setScenario(selectedScenario);

    const storedFullName =
      localStorage.getItem("full_name") || "";

    setFullName(storedFullName);

    authFetch(`${API_BASE_URL}/profile/me/context`)
      .then((response) => {
        if (!response.ok) {
          return null;
        }

        return response.json();
      })
      .then((data: BusinessContextResponse | null) => {
        if (data?.business_name) {
          setBusinessName(data.business_name);
        }
      })
      .catch((error) => {
        console.error(
          "Could not load business context",
          error
        );
      });

    setLoadingStatus(true);

    authFetch(
      `${API_BASE_URL}/profile/me/scenario-status?scenario=${encodeURIComponent(
        selectedScenario
      )}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Scenario status failed: ${response.status}`
          );
        }

        return response.json();
      })
      .then((data: ScenarioStatus) => {
        setScenarioStatus(data);

        if (
          data.has_history &&
          data.weakest_dimension
        ) {
          const recommended =
            mapWeakestDimensionToFocusArea(
              data.weakest_dimension
            );

          if (recommended) {
            setFocusArea(recommended);
            return;
          }
        }

        setFocusArea("discovery");
      })
      .catch((error) => {
        console.error(
          "Could not load scenario status",
          error
        );

        setScenarioStatus({
          has_history: false,
          scenario: selectedScenario,
          version: null,
          weakest_dimension: null,
          metric_scores: null,
        });

        setFocusArea("discovery");
      })
      .finally(() => {
        setLoadingStatus(false);
      });
  }, []);

  function getFocusTitle(focusId: string) {
    const focus = focusAreas.find(
      (item) => item.id === focusId
    );

    return focus ? t(focus.titleKey) : "-";
  }

  function startPracticeCall() {
    const params = new URLSearchParams({
      scenario,
      business_context: businessContext,
      focus_area: focusArea,
    });

    router.push(`/call?${params.toString()}`);
  }

  const scenarioTitleKey =
    scenarioTitleKeys[scenario] ||
    "scenarioNames.coldCall";

  const scenarioTitle = t(scenarioTitleKey);

  const recommendedFocus =
    scenarioStatus?.has_history
      ? mapWeakestDimensionToFocusArea(
          scenarioStatus.weakest_dimension
        )
      : null;

  const recommendedFocusTitle =
    recommendedFocus
      ? getFocusTitle(recommendedFocus)
      : null;

  const selectedFocusTitle =
    getFocusTitle(focusArea);

  const usingRecommendedFocus =
    Boolean(recommendedFocus) &&
    recommendedFocus === focusArea;

  const metricScores =
    scenarioStatus?.metric_scores || {};

  return (
    <AppShell>
      <div style={pageStyle}>

        {/* USER BAR */}
        <section style={userBarStyle}>
          <div>
            <h2 style={userGreetingStyle}>
              {fullName
                ? `${t("greeting", {
                    name: fullName,
                  })} 👋`
                : t("eyebrow")}
            </h2>

            {businessName && (
              <p style={businessTextStyle}>
                {businessName}
              </p>
            )}
          </div>

          <div style={scenarioBadgeStyle}>
            <span style={scenarioBadgeIconStyle}>
              ☎️
            </span>

            <div>
              <strong style={scenarioBadgeTitleStyle}>
                {scenarioTitle.toUpperCase()}
              </strong>

              <span style={scenarioBadgeSubtitleStyle}>
                {t("readyToPractice")}
              </span>
            </div>
          </div>
        </section>

        {/* HERO */}
        <section style={heroStyle}>
          <div style={{ flex: 1 }}>
            <p style={eyebrowStyle}>
              {t("eyebrow")}
            </p>

            <h1 style={heroTitleStyle}>
              {t("scenarioReadyTitle", {
                scenario: scenarioTitle,
              })}
            </h1>

            <p style={heroSubtitleStyle}>
              {scenarioStatus?.has_history
                ? t("scenarioReadyWithHistory")
                : t("scenarioReadyWithoutHistory")}
            </p>
          </div>

          <div style={heroArtworkStyle}>
  <img
    src="/practice-target.png"
    alt=""
    aria-hidden="true"
    style={{
      width: "100%",
      maxWidth: "390px",
      height: "170px",
      objectFit: "contain",
      objectPosition: "right center",
    }}
  />
</div>
        </section>

        <div style={contentGridStyle}>

          {/* LEFT COLUMN */}
          <main style={leftColumnStyle}>

            {/* PERFORMANCE CARD */}
            {loadingStatus ? (
              <section style={cardStyle}>
                <p style={loadingTextStyle}>
                  {t("loadingPreviousPerformance")}
                </p>
              </section>
            ) : scenarioStatus?.has_history ? (
              <section style={performanceCardStyle}>
                <div style={performanceHeaderStyle}>
                  <h2 style={cardTitleStyle}>
                    {t("lastScenarioPerformance", {
                      scenario: scenarioTitle,
                    })}
                  </h2>

                  {scenarioStatus.version !== null && (
                    <span style={profileBadgeStyle}>
                      {t("profileVersion", {
                        version:
                          scenarioStatus.version,
                      })}
                    </span>
                  )}
                </div>

                <div style={performanceListStyle}>
                  {focusAreas.map((item) => {
                    const rawScore =
                      metricScores[item.metricKey];

                    const percentage =
                      scoreToPercent(rawScore);

                    const isWeakest =
                      item.id === recommendedFocus;

                    return (
                      <div
                        key={item.id}
                        style={performanceRowStyle}
                      >
                        <div
                          style={performanceIconStyle}
                        >
                          {item.icon}
                        </div>

                        <span
                          style={performanceLabelStyle}
                        >
                          {t(item.titleKey)}
                        </span>

                        <div
                          style={progressTrackStyle}
                        >
                          <div
                            style={{
                              ...progressFillStyle,
                              width: `${percentage}%`,
                              background:
                                isWeakest
                                  ? "#e76245"
                                  : "#07875f",
                            }}
                          />
                        </div>

                        <strong
                          style={{
                            ...percentageStyle,
                            color: isWeakest
                              ? "#d84a32"
                              : "#067a57",
                          }}
                        >
                          {percentage}%
                        </strong>
                      </div>
                    );
                  })}
                </div>

                {recommendedFocusTitle && (
                  <div style={weakestBannerStyle}>
                    <span style={{ fontSize: "22px" }}>
                      ↓
                    </span>

                    <strong>
                      {recommendedFocusTitle}
                    </strong>

                    <span>
                      {t("needsMostImprovement")}
                    </span>
                  </div>
                )}
              </section>
            ) : (
              <section style={firstTimeCardStyle}>
                <div style={firstTimeIconStyle}>
                  ✨
                </div>

                <div>
                  <h2 style={cardTitleStyle}>
                    {t("noScenarioHistory", {
                      scenario: scenarioTitle,
                    })}
                  </h2>

                  <p style={firstTimeTextStyle}>
                    {t("firstScenarioDescription")}
                  </p>
                </div>
              </section>
            )}

            {/* FOCUS CARD */}
            <section style={focusCardStyle}>
              <div style={focusHeaderStyle}>
                <h2 style={cardTitleStyle}>
                  {t("chooseFocusTitle")}
                </h2>

                <p style={cardSubtitleStyle}>
                  {scenarioStatus?.has_history
                    ? t(
                        "focusDescriptionWithHistory"
                      )
                    : t(
                        "focusDescriptionNoHistory"
                      )}
                </p>
              </div>

              <div style={focusGridStyle}>
                {focusAreas.map((item) => {
                  const active =
                    item.id === focusArea;

                  return (
                    <button
                      key={item.id}
                      data-testid={`focus-${item.id}`}
                      onClick={() =>
                        setFocusArea(item.id)
                      }
                      style={{
                        ...focusOptionStyle,
                        ...(active
                          ? selectedFocusStyle
                          : {}),
                      }}
                    >
                      <span style={focusIconStyle}>
                        {item.icon}
                      </span>

                      <strong
                        style={{
                          fontSize: "15px",
                          color: "#101828",
                        }}
                      >
                        {t(item.titleKey)}
                      </strong>

                      {active && (
                        <span style={checkmarkStyle}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {usingRecommendedFocus &&
                recommendedFocusTitle && (
                  <div style={recommendationTipStyle}>
                    <span>💡</span>

                    <span>
                      {t("recommendedTip", {
                        area:
                          recommendedFocusTitle,
                      })}
                    </span>
                  </div>
                )}
            </section>
          </main>

          {/* RIGHT SUMMARY */}
          <aside style={summaryCardStyle}>
            <p style={eyebrowStyle}>
              {t("practiceSummary")}
            </p>

            <div style={summaryScenarioStyle}>
              <span style={summaryPhoneStyle}>
                ☎️
              </span>

              <h2 style={summaryScenarioTitleStyle}>
                {scenarioTitle}
              </h2>
            </div>

            <SummaryRow
              icon="🎯"
              label={t("focusAreaLabel")}
              value={selectedFocusTitle}
            />

            <SummaryRow
              icon="📊"
              label={t("difficulty")}
              value={t("medium")}
            />

            <SummaryRow
              icon="🕒"
              label={t("estimatedTime")}
              value={t("threeMinutes")}
            />

            {usingRecommendedFocus && (
              <div style={aiRecommendedCardStyle}>
                <div style={aiRecommendedIconStyle}>
                  ⭐
                </div>

                <div>
                  <strong
                    style={{
                      color: "#006b4f",
                    }}
                  >
                    {t("recommendedByAI")}
                  </strong>

                  <p style={aiRecommendedTextStyle}>
                    {t("basedOnLastScenario", {
                      scenario: scenarioTitle,
                    })}
                  </p>
                </div>
              </div>
            )}

            <div style={nextStepsCardStyle}>
              <h3 style={nextStepsTitleStyle}>
                {t("whatHappensNext")}
              </h3>

              <NextStep
                icon="🎙️"
                text={t(
                  "microphonePermission"
                )}
              />

              <NextStep
                icon="👥"
                text={t("aiCustomerJoins")}
              />

              <NextStep
                icon="☎️"
                text={t("endAnytime")}
              />
            </div>

            <button
              data-testid="start-practice-call"
              onClick={startPracticeCall}
              style={startButtonStyle}
            >
              <span>▶</span>
              <span>{t("startCall")}</span>
              <span>→</span>
            </button>

            <div style={durationNoteStyle}>
              🔒 {t("takesThreeMinutes")}
            </div>
          </aside>
        </div>

        {/* BOTTOM INFO */}
        <section style={bottomInfoStyle}>
          <div style={bottomInfoIconStyle}>
            🛡️
          </div>

          <div>
            <strong style={bottomInfoTitleStyle}>
              {t("practiceSessionTitle")}
            </strong>

            <p style={bottomInfoTextStyle}>
              {t("practiceSessionDescription")}
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div style={summaryRowStyle}>
      <div style={summaryLabelWrapStyle}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>

      <strong style={{ color: "#101828" }}>
        {value}
      </strong>
    </div>
  );
}

function NextStep({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div style={nextStepStyle}>
      <span style={nextStepIconStyle}>
        {icon}
      </span>

      <span>{text}</span>
    </div>
  );
}

/* ============================= */
/* STYLES                        */
/* ============================= */

const pageStyle: React.CSSProperties = {
  maxWidth: "1380px",
  margin: "0 auto",
  padding: "24px 28px 48px",
};

const userBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "28px",
  background: "#ffffff",
  border: "1px solid #e5ece9",
  borderRadius: "24px",
  padding: "22px 30px",
  marginBottom: "24px",
  boxShadow:
    "0 12px 34px rgba(16, 24, 40, 0.06)",
};

const userGreetingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "26px",
  color: "#101828",
  fontWeight: 900,
};

const businessTextStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#475467",
  fontWeight: 650,
  fontSize: "15px",
};

const scenarioBadgeStyle: React.CSSProperties = {
  display: "flex",
  gap: "13px",
  alignItems: "center",
  border: "1px solid #dce8e3",
  borderRadius: "19px",
  padding: "11px 17px",
  background: "#f8fcfa",
};

const scenarioBadgeIconStyle: React.CSSProperties = {
  width: "46px",
  height: "46px",
  borderRadius: "50%",
  background: "#e5f5ee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "21px",
};

const scenarioBadgeTitleStyle: React.CSSProperties = {
  display: "block",
  color: "#007052",
  fontSize: "13px",
  fontWeight: 900,
};

const scenarioBadgeSubtitleStyle: React.CSSProperties = {
  display: "block",
  color: "#475467",
  fontSize: "12px",
  marginTop: "4px",
};

const heroStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: "210px",
  padding: "38px 42px",
  marginBottom: "28px",
  borderRadius: "30px",
  overflow: "hidden",
  background:
    "linear-gradient(120deg, #ffffff 0%, #f7fcfa 48%, #e7f7f0 100%)",
  border: "1px solid #dcebe5",
  boxShadow:
    "0 20px 50px rgba(16, 24, 40, 0.07)",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 9px",
  color: "#007052",
  fontWeight: 900,
  fontSize: "14px",
};

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "42px",
  lineHeight: 1.08,
  letterSpacing: "-1.1px",
  fontWeight: 950,
};

const heroSubtitleStyle: React.CSSProperties = {
  margin: "16px 0 0",
  color: "#667085",
  fontSize: "17px",
  maxWidth: "720px",
  lineHeight: 1.65,
};

const heroArtworkStyle: React.CSSProperties = {
  width: "260px",
  minHeight: "150px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background:
    "radial-gradient(circle, #d9f3e8 0%, rgba(217,243,232,0) 72%)",
};

const targetCircleStyle: React.CSSProperties = {
  width: "120px",
  height: "120px",
  borderRadius: "50%",
  border: "11px solid #27886c",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "58px",
  background: "white",
  boxShadow:
    "0 14px 34px rgba(7, 135, 95, 0.16)",
};

const contentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1.8fr) 390px",
  gap: "28px",
  alignItems: "start",
};

const leftColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: "24px",
};

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e4eae7",
  borderRadius: "26px",
  padding: "30px",
  boxShadow:
    "0 16px 42px rgba(16, 24, 40, 0.07)",
};

const performanceCardStyle: React.CSSProperties = {
  ...cardStyle,
  padding: "32px",
};

const performanceHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "26px",
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "22px",
  fontWeight: 900,
};

const cardSubtitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
  lineHeight: 1.55,
  fontSize: "15px",
};

const profileBadgeStyle: React.CSSProperties = {
  padding: "7px 13px",
  borderRadius: "999px",
  background: "#eaf7f1",
  color: "#047556",
  fontWeight: 800,
  fontSize: "12px",
};

const performanceListStyle: React.CSSProperties = {
  display: "grid",
  gap: "20px",
};

const performanceRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "50px 200px minmax(150px, 1fr) 64px",
  alignItems: "center",
  gap: "18px",
  minHeight: "54px",
};

const performanceIconStyle: React.CSSProperties = {
  width: "46px",
  height: "46px",
  borderRadius: "14px",
  background: "#f4f8f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
};

const performanceLabelStyle: React.CSSProperties = {
  color: "#202939",
  fontWeight: 750,
  fontSize: "15px",
};

const progressTrackStyle: React.CSSProperties = {
  height: "12px",
  borderRadius: "999px",
  background: "#e8edeb",
  overflow: "hidden",
};

const progressFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  transition: "width 300ms ease",
};

const percentageStyle: React.CSSProperties = {
  textAlign: "right",
  fontSize: "18px",
  fontWeight: 800,
};

const weakestBannerStyle: React.CSSProperties = {
  marginTop: "24px",
  display: "flex",
  alignItems: "center",
  gap: "9px",
  background: "#fff4f1",
  borderRadius: "14px",
  padding: "13px 16px",
  color: "#d84a32",
  fontSize: "14px",
};

const firstTimeCardStyle: React.CSSProperties = {
  ...cardStyle,
  display: "flex",
  alignItems: "center",
  gap: "20px",
  background:
    "linear-gradient(120deg, #ffffff, #f4f8ff)",
};

const firstTimeIconStyle: React.CSSProperties = {
  width: "60px",
  height: "60px",
  borderRadius: "18px",
  background: "#eaf1ff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "29px",
};

const firstTimeTextStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
  lineHeight: 1.6,
};

const loadingTextStyle: React.CSSProperties = {
  color: "#667085",
  margin: 0,
};

const focusCardStyle: React.CSSProperties = {
  ...cardStyle,
};

const focusHeaderStyle: React.CSSProperties = {
  marginBottom: "22px",
};

const focusGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const focusOptionStyle: React.CSSProperties = {
  minHeight: "108px",
  borderRadius: "20px",
  border: "1px solid #dfe7e3",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  gap: "18px",
  padding: "20px 22px",
  cursor: "pointer",
  position: "relative",
  textAlign: "left",
  transition: "all 180ms ease",
};

const selectedFocusStyle: React.CSSProperties = {
  border: "2px solid #07875f",
  background:
    "linear-gradient(120deg, #ffffff 0%, #edf9f4 100%)",
  boxShadow:
    "0 12px 28px rgba(7, 135, 95, 0.12)",
};

const focusIconStyle: React.CSSProperties = {
  width: "50px",
  height: "50px",
  borderRadius: "14px",
  background: "#f2f8f5",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "25px",
  flexShrink: 0,
};

const checkmarkStyle: React.CSSProperties = {
  position: "absolute",
  right: "15px",
  top: "15px",
  width: "25px",
  height: "25px",
  borderRadius: "50%",
  background: "#07875f",
  color: "#fff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "13px",
  fontWeight: 900,
};

const recommendationTipStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "14px 16px",
  background: "#effaf5",
  color: "#44546a",
  border: "1px solid #cee9dd",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "14px",
};

const summaryCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe8e4",
  borderRadius: "28px",
  padding: "30px",
  boxShadow:
    "0 20px 48px rgba(16, 24, 40, 0.09)",
  position: "sticky",
  top: "24px",
};

const summaryScenarioStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "18px",
};

const summaryPhoneStyle: React.CSSProperties = {
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  background: "#e7f4ef",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "22px",
};

const summaryScenarioTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 900,
  color: "#101828",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  padding: "16px 0",
  borderBottom: "1px solid #edf0ef",
  color: "#344054",
};

const summaryLabelWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#667085",
};

const aiRecommendedCardStyle: React.CSSProperties = {
  marginTop: "20px",
  background:
    "linear-gradient(120deg, #f7fcf9, #ebf8f2)",
  border: "1px solid #cce6da",
  borderRadius: "18px",
  padding: "16px",
  display: "flex",
  alignItems: "flex-start",
  gap: "13px",
};

const aiRecommendedIconStyle: React.CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "#e3f5ec",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const aiRecommendedTextStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#5b6878",
  lineHeight: 1.5,
  fontSize: "13px",
};

const nextStepsCardStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "20px",
  borderRadius: "18px",
  background: "#f8faf9",
  border: "1px solid #e8eeeb",
};

const nextStepsTitleStyle: React.CSSProperties = {
  margin: "0 0 16px",
  color: "#101828",
  fontSize: "17px",
};

const nextStepStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "11px",
  color: "#526071",
  fontSize: "14px",
  lineHeight: 1.5,
  marginTop: "13px",
};

const nextStepIconStyle: React.CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  background: "#e4f4ed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const startButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: "16px",
  padding: "18px",
  marginTop: "22px",
  background:
    "linear-gradient(90deg, #087d59 0%, #00996d 100%)",
  color: "white",
  fontWeight: 900,
  fontSize: "16px",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "11px",
  boxShadow:
    "0 14px 30px rgba(7, 135, 95, 0.24)",
};

const durationNoteStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: "11px",
  color: "#7a8696",
  fontSize: "12px",
};

const bottomInfoStyle: React.CSSProperties = {
  marginTop: "26px",
  padding: "20px 24px",
  borderRadius: "22px",
  border: "1px solid #cfe3f7",
  background:
    "linear-gradient(90deg, #f2f8ff 0%, #fbfdff 100%)",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  boxShadow:
    "0 10px 28px rgba(60, 100, 140, 0.06)",
};

const bottomInfoIconStyle: React.CSSProperties = {
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  background: "#e6f0ff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "24px",
};

const bottomInfoTitleStyle: React.CSSProperties = {
  color: "#213145",
  fontSize: "15px",
};

const bottomInfoTextStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#657386",
  fontSize: "14px",
  lineHeight: 1.45,
};