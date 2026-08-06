"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";

const scenarios = [
  {
    id: "cold_call",
    title: "Cold Call",
    icon: "☎️",
    label: "Prospecting",
    description: "Pitch AI Sales Coach to a prospect who does not know you.",
  },
  {
    id: "hot_call",
    title: "Hot Call",
    icon: "🔥",
    label: "Follow-up",
    description: "Follow up with a prospect already interested in AI Sales Coach.",
  },
  {
    id: "directsales",
    title: "Direct Sales",
    icon: "🛒",
    label: "Closing",
    description: "Close AI Sales Coach directly on the call.",
  },
  {
    id: "meeting",
    title: "Meeting",
    icon: "👥",
    label: "Decision-maker",
    description: "Run an AI Sales Coach sales meeting with a decision-maker.",
  },
];

export default function ScenariosPage() {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState("cold_call");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function startSession() {
  setError("");
  setLoading(true);
  router.push(`/practice-setup?scenario=${selectedScenario}`);
}

  const selected = scenarios.find((scenario) => scenario.id === selectedScenario);

  return (
    <AppShell>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <section
          style={{
            background:
              "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
            border: "1px solid #dfeee8",
            borderRadius: "28px",
            padding: "34px",
            boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
            marginBottom: "26px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#006b4f",
              fontWeight: 800,
              fontSize: "14px",
            }}
          >
            Practice Setup
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "38px",
              fontWeight: 800,
              color: "#101828",
              letterSpacing: "-0.8px",
            }}
          >
            Choose your practice scenario
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#667085",
              fontSize: "17px",
              maxWidth: "620px",
              lineHeight: "1.6",
            }}
          >
            Select a conversation type and start a realistic AI sales practice
            call. The AI customer will respond based on the selected scenario.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 0.8fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <section
            style={{
              background: "white",
              borderRadius: "26px",
              padding: "28px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "18px",
              }}
            >
              {scenarios.map((scenario) => {
                const active = selectedScenario === scenario.id;

                return (
                  <button
  data-testid={`scenario-${scenario.id}`}
  key={scenario.id}
  onClick={() => setSelectedScenario(scenario.id)}
  style={{
                      minHeight: "190px",
                      padding: "22px",
                      borderRadius: "22px",
                      background: active ? "#f0faf6" : "#ffffff",
                      border: active
                        ? "2px solid #006b4f"
                        : "1px solid #e5e7eb",
                      textAlign: "left",
                      cursor: "pointer",
                      boxShadow: active
                        ? "0 16px 30px rgba(0, 107, 79, 0.14)"
                        : "0 8px 20px rgba(16, 24, 40, 0.04)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "18px",
                      }}
                    >
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "16px",
                          background: active ? "#d9f2e8" : "#f2f4f7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                        }}
                      >
                        {scenario.icon}
                      </div>

                      <span
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "999px",
                          border: active
                            ? "7px solid #006b4f"
                            : "2px solid #d0d5dd",
                          background: "white",
                        }}
                      />
                    </div>

                    <p
                      style={{
                        margin: "0 0 8px",
                        color: "#006b4f",
                        fontSize: "13px",
                        fontWeight: 800,
                      }}
                    >
                      {scenario.label}
                    </p>

                    <h2
                      style={{
                        fontSize: "20px",
                        margin: "0 0 10px",
                        color: "#101828",
                      }}
                    >
                      {scenario.title}
                    </h2>

                    <p
                      style={{
                        color: "#667085",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        margin: 0,
                      }}
                    >
                      {scenario.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <aside
            style={{
              background: "white",
              borderRadius: "26px",
              padding: "28px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
              position: "sticky",
              top: "28px",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                color: "#667085",
                fontSize: "14px",
              }}
            >
              Selected scenario
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: "28px",
                color: "#101828",
              }}
            >
              {selected?.icon} {selected?.title}
            </h2>

            <p
              style={{
                color: "#667085",
                lineHeight: "1.6",
                marginTop: "14px",
              }}
            >
              {selected?.description}
            </p>

            <div
              style={{
                marginTop: "22px",
                padding: "18px",
                borderRadius: "18px",
                background: "#f9fafb",
                border: "1px solid #eef2f6",
              }}
            >
              <strong style={{ color: "#101828" }}>What happens next?</strong>

              <ul
                style={{
                  margin: "12px 0 0",
                  paddingLeft: "18px",
                  color: "#667085",
                  lineHeight: "1.8",
                }}
              >
                <li>Microphone permission will be requested.</li>
                <li>The AI customer will join the call.</li>
                <li>You can end the call anytime.</li>
              </ul>
            </div>

            {error && (
              <p style={{ color: "#b42318", marginTop: "18px" }}>{error}</p>
            )}

            <button
  data-testid="continue-to-setup"
  onClick={startSession}
  disabled={loading}
  style={{
                width: "100%",
                marginTop: "24px",
                padding: "16px",
                borderRadius: "16px",
                border: "none",
                background: "#006b4f",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 12px 24px rgba(0, 107, 79, 0.24)",
              }}
            >
              {loading ? "Preparing Call..." : "Start Practice Call →"}
            </button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}