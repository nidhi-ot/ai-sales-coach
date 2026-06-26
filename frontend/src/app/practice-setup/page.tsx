"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";

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

const frameworks = [
  {
    id: "BANT",
    title: "BANT",
    description: "Budget, Authority, Need, Timeline",
  },
  {
    id: "MEDDIC",
    title: "MEDDIC",
    description: "Metrics, Economic Buyer, Decision Criteria",
  },
  {
    id: "SPIN",
    title: "SPIN",
    description: "Situation, Problem, Implication, Need Payoff",
  },
];

const focusAreas = [
  { id: "discovery", title: "Discovery", icon: "🔍" },
  { id: "handling_objections", title: "Handling Objections", icon: "🛡️" },
  { id: "value_proposition", title: "Value Proposition", icon: "💡" },
  { id: "closing", title: "Closing", icon: "🏆" },
];

export default function PracticeSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scenario = searchParams.get("scenario") || "cold_call";

  const [businessContext, setBusinessContext] = useState("apartment_association");
  const [framework, setFramework] = useState("BANT");
  const [focusArea, setFocusArea] = useState("handling_objections");

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
            Choose the customer context, sales framework, and focus area before
            starting your AI practice call.
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
              title="Today's Focus"
              description="Choose what the AI customer should challenge you on."
            >
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
            <SummaryRow label="Focus Area" value={selectedFocus?.title || "-"} />
            <SummaryRow label="Difficulty" value="Medium" />
            <SummaryRow label="Estimated Time" value="3 min" />

            <div style={previewBoxStyle}>
              <strong>What happens next?</strong>
              <ul style={{ color: "#667085", lineHeight: "1.8", paddingLeft: "20px" }}>
                <li>Microphone permission will be requested.</li>
                <li>The AI customer will join the call.</li>
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
      <strong style={{ color: "#101828" }}>{value}</strong>
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

const frameworkGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
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

const optionIconStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "16px",
  background: "#f2f4f7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
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