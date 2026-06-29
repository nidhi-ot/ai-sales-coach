"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import { API_BASE_URL } from "../../lib/api";

type LearningProfile = {
  version: number;
  weakest_dimension: string;
  metric_scores?: Record<string, number>;
};

const businessContexts = [
  {
    id: "apartment_association",
    title: "Apartment Association",
    description: "A residential property manager responsible for stair cleaning.",
    icon: "🏢",
  },
  {
    id: "office_building",
    title: "Office Building",
    description: "An office manager looking for reliable cleaning service.",
    icon: "🏬",
  },
  {
    id: "hotel",
    title: "Hotel",
    description: "A hotel manager focused on cleanliness and guest experience.",
    icon: "🏨",
  },
  {
    id: "retail_store",
    title: "Retail Store",
    description: "A store owner who wants a clean customer-facing space.",
    icon: "🛒",
  },
];

const focusAreas = [
  { id: "discovery", title: "Discovery", icon: "🔍" },
  { id: "handling_objections", title: "Handling Objections", icon: "🛡️" },
  { id: "value_proposition", title: "Value Proposition", icon: "💡" },
  { id: "closing", title: "Closing", icon: "🏆" },
];

function mapWeakestDimensionToFocusArea(value: string) {
  switch (value) {
    case "objection_handling":
      return "handling_objections";

    case "rapport":
      return "value_proposition";

    case "discovery":
      return "discovery";

    case "closing":
      return "closing";

    default:
      return "handling_objections";
  }
}

function formatFocusLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace("handling objections", "Handling Objections")
    .replace("objection handling", "Objection Handling")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PracticeSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scenario = searchParams.get("scenario") || "cold_call";

  const [businessContext, setBusinessContext] = useState("apartment_association");
  const [framework, setFramework] = useState("BANT");
  const [focusArea, setFocusArea] = useState("handling_objections");
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);

  useEffect(() => {
    const repId = localStorage.getItem("rep_id");

    if (!repId) return;

    fetch(`${API_BASE_URL}/profile/${repId}/latest`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: LearningProfile | null) => {
        if (!data) return;

        setLearningProfile(data);
        setFocusArea(mapWeakestDimensionToFocusArea(data.weakest_dimension));
      })
      .catch((error) => {
        console.warn("Could not load learning profile:", error);
      });
  }, []);

  function startPracticeCall() {
    const params = new URLSearchParams({
      scenario,
      business_context: businessContext,
      framework,
      focus_area: focusArea,
    });

    router.push(`/call?${params.toString()}`);
  }

  const selectedBusiness = businessContexts.find(
    (item) => item.id === businessContext
  );

  const selectedFocus = focusAreas.find((item) => item.id === focusArea);

  return (
    <AppShell>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <p style={eyebrowStyle}>Practice Setup</p>

          <h1 style={heroTitleStyle}>Let&apos;s get you ready</h1>

          <p style={heroSubtitleStyle}>
            Choose the customer context and sales framework. Your AI coaching
            focus is recommended from your latest practice profile.
          </p>
        </section>

        <div style={layoutStyle}>
          <section style={mainPanelStyle}>
            <SetupSection
              step="1"
              title="Business Context"
              description="Choose what type of customer the AI should act as."
            >
              <div style={cardGridStyle}>
                {businessContexts.map((item) => (
                  <OptionCard
                    key={item.id}
                    active={businessContext === item.id}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    onClick={() => setBusinessContext(item.id)}
                  />
                ))}
              </div>
            </SetupSection>

            <SetupSection
              step="2"
              title="Sales Framework"
              description="Choose the sales framework you want to practice."
            >
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                style={selectStyle}
              >
              <option value="BANT">BANT - Budget, Authority, Need, Timeline</option>
              <option value="MEDDIC">MEDDIC - Metrics, Economic Buyer, Decision Criteria</option>
              <option value="SPIN">SPIN - Situation, Problem, Implication, Need Payoff</option>
              </select>
            </SetupSection>

            <SetupSection
              step="3"
              title="AI Coaching Recommendation"
              description="Your recommended focus is based on your latest practice result. You can still override it manually."
            >
              {learningProfile ? (
                <div style={recommendationBoxStyle}>
                  <p style={{ margin: 0, fontWeight: 900, color: "#006b4f" }}>
                    Adaptive Learning Profile
                  </p>

                  <div style={recommendationGridStyle}>
                    <div>
                      <span style={smallLabelStyle}>Profile Version</span>
                      <strong>v{learningProfile.version}</strong>
                    </div>

                    <div>
                      <span style={smallLabelStyle}>Recommended Focus</span>
                      <strong>
                        {formatFocusLabel(learningProfile.weakest_dimension)}
                      </strong>
                    </div>
                  </div>

                  <p style={{ margin: "12px 0 0", color: "#475467" }}>
                    This was your weakest skill in the latest profile. The AI
                    customer will naturally challenge you on this area.
                  </p>
                </div>
              ) : (
                <div style={recommendationBoxStyle}>
                  <p style={{ margin: 0, fontWeight: 900, color: "#006b4f" }}>
                    No learning profile yet
                  </p>
                  <p style={{ margin: "8px 0 0", color: "#475467" }}>
                    Complete one practice call to generate your adaptive coaching
                    profile.
                  </p>
                </div>
              )}

              <p style={{ margin: "0 0 12px", color: "#667085", fontWeight: 700 }}>
                Change focus manually, if needed:
              </p>

              <div style={focusGridStyle}>
                {focusAreas.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFocusArea(item.id)}
                    style={{
                      ...focusButtonStyle,
                      border:
                        focusArea === item.id
                          ? "2px solid #006b4f"
                          : "1px solid #e5e7eb",
                      background: focusArea === item.id ? "#e7f4ef" : "white",
                    }}
                  >
                    <span style={{ fontSize: "22px" }}>{item.icon}</span>
                    <strong>{item.title}</strong>
                  </button>
                ))}
              </div>
            </SetupSection>
          </section>

          <aside style={summaryPanelStyle}>
            <p style={eyebrowStyle}>Practice Summary</p>

            <h2 style={{ marginTop: "8px", color: "#101828" }}>
              {formatScenario(scenario)}
            </h2>

            <SummaryRow label="Business Context" value={selectedBusiness?.title || "-"} />
            <SummaryRow label="Framework" value={framework} />
            <SummaryRow
              label="Focus Area"
              value={
                learningProfile
                  ? `${selectedFocus?.title || "-"} - Profile v${learningProfile.version}`
                  : selectedFocus?.title || "-"
              }
            />
            <SummaryRow label="Difficulty" value="Medium" />
            <SummaryRow label="Estimated Time" value="3 min" />

            <div style={previewBoxStyle}>
              <strong>What happens next?</strong>
              <ul style={{ color: "#667085", lineHeight: "1.8", paddingLeft: "20px" }}>
                <li>Microphone permission will be requested.</li>
                <li>The AI customer will join the call.</li>
                <li>
                  The AI will challenge your selected focus area:{" "}
                  <strong>{selectedFocus?.title || "-"}</strong>.
                </li>
                <li>You can end the call anytime.</li>
              </ul>
            </div>

            <button onClick={startPracticeCall} style={primaryButtonStyle}>
              Start Practice Call →
            </button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function SetupSection({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "34px" }}>
      <div style={{ display: "flex", gap: "14px", marginBottom: "18px" }}>
        <div style={stepBadgeStyle}>{step}</div>

        <div>
          <h2 style={{ margin: 0, color: "#101828" }}>{title}</h2>
          <p style={{ margin: "6px 0 0", color: "#667085" }}>{description}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function OptionCard({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: "16px",
        border: active ? "2px solid #006b4f" : "1px solid #e5e7eb",
        background: active ? "#f0faf6" : "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: "74px",
          height: "58px",
          borderRadius: "12px",
          background: "#e7f4ef",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={{ margin: "0 0 6px", color: "#101828", fontSize: "16px" }}>
          {title}
        </h3>

        <p style={{ margin: 0, color: "#667085", lineHeight: "1.45" }}>
          {description}
        </p>
      </div>

      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "999px",
          border: active ? "6px solid #006b4f" : "2px solid #cbd5e1",
          flexShrink: 0,
        }}
      />
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryRowStyle}>
      <span style={{ color: "#667085" }}>{label}</span>
      <strong style={{ color: "#101828", textAlign: "right" }}>{value}</strong>
    </div>
  );
}

function formatScenario(value: string) {
  return value
    .replaceAll("_", " ")
    .replace("direct sales", "Direct Sales")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
  border: "1px solid #dfeee8",
  borderRadius: "28px",
  padding: "34px",
  boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
  marginBottom: "28px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#006b4f",
  fontWeight: 800,
  fontSize: "14px",
};

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "38px",
  fontWeight: 900,
  color: "#101828",
};

const heroSubtitleStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "16px",
  maxWidth: "720px",
  lineHeight: "1.6",
};

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  gap: "24px",
  alignItems: "start",
};

const mainPanelStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "28px",
  padding: "30px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
};

const summaryPanelStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "28px",
  padding: "26px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
  position: "sticky",
  top: "24px",
};

const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
};
const focusGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "14px",
};

const focusButtonStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  cursor: "pointer",
  display: "grid",
  gap: "10px",
  justifyItems: "center",
  color: "#101828",
};

const recommendationBoxStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "#f0fdf4",
  border: "1px solid #b7e4d4",
  marginBottom: "18px",
};

const recommendationGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
  marginTop: "14px",
};

const smallLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "13px",
  marginBottom: "4px",
};


const stepBadgeStyle: React.CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  background: "#006b4f",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  flexShrink: 0,
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  padding: "14px 0",
  borderBottom: "1px solid #f2f4f7",
};

const previewBoxStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "18px",
  borderRadius: "18px",
  background: "#f9fafb",
  border: "1px solid #eef2f6",
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "22px",
  padding: "15px",
  borderRadius: "14px",
  border: "none",
  background: "#006b4f",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(0,107,79,0.22)",
};
const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #d0d5dd",
  background: "white",
  color: "#101828",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
};
