"use client";

import { useState } from "react";
import AppShell from "../../components/AppShell";

const scenarios = [
  {
    id: "cold_call",
    title: "Cold Call",
    icon: "☎️",
    description: "Pitch AI Sales Coach to a prospect who does not know you.",
  },
  {
    id: "hot_call",
    title: "Hot Call",
    icon: "🔥",
    description: "Follow up with a prospect already interested in AI Sales Coach.",
  },
  {
    id: "direktförsäljning",
    title: "Direktförsäljning",
    icon: "🛒",
    description: "Close AI Sales Coach directly on the call.",
  },
  {
    id: "meeting",
    title: "Meeting",
    icon: "👥",
    description: "Run an AI Sales Coach sales meeting with a decision-maker.",
  },
];

export default function ScenariosPage() {
  const [selectedScenario, setSelectedScenario] = useState("cold_call");

  async function startSession() {
  const systemInstruction = `
You are an AI buyer in an AI Sales Coach training session.
Scenario: ${selectedScenario}
Act realistically and challenge the salesperson with objections.
`;

  const response = await fetch("http://127.0.0.1:8000/api/v1/sessions/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
        rep_id: localStorage.getItem("rep_id"),
        business_id: localStorage.getItem("business_id"),
        scenario: selectedScenario,
        system_instruction: systemInstruction,
    }),
  });

  const data = await response.json();

  console.log("Session created:", data);
  alert("Practice session started!");
}

  return (
    <AppShell>
      <section
        style={{
          maxWidth: "760px",
          background: "white",
          borderRadius: "24px",
          padding: "32px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h1>Choose Scenario</h1>
        <p style={{ color: "#667085" }}>
          Select the AI Sales Coach conversation you want to practice.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              style={{
                minHeight: "155px",
                padding: "22px",
                borderRadius: "18px",
                background: "white",
                border:
                  selectedScenario === scenario.id
                    ? "2px solid #006b4f"
                    : "1px solid #e5e7eb",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "14px" }}>
                {scenario.icon}
              </div>

              <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
                {scenario.title}
              </h2>

              <p style={{ color: "#667085", fontSize: "14px" }}>
                {scenario.description}
              </p>

              <div style={{ textAlign: "right", fontSize: "20px" }}>→</div>
            </button>
          ))}
        </div>

        <button
  onClick={startSession}
  style={{
    width: "100%",
    marginTop: "24px",
    padding: "15px",
    borderRadius: "14px",
    border: "none",
    background: "#006b4f",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  }}
>
  Start Practice Call
</button>
      </section>
    </AppShell>
  );
}