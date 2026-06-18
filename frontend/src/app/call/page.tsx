"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";

type CallStatus = "connecting" | "active" | "ending" | "ended" | "failed";

export default function CallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scenario = searchParams.get("scenario") || "cold_call";
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<CallStatus>("connecting");
  const [error, setError] = useState("");

  useEffect(() => {
    async function startCall() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // This is the placeholder for realtime backend connection.
        // Once Fortuna confirms the bootstrap endpoint, connect it here.
        setStatus("active");
      } catch (error) {
        console.error(error);
        setError("Microphone access failed. Please allow microphone permission.");
        setStatus("failed");
      }
    }

    startCall();
  }, []);

  function handleEndCall() {
    setStatus("ending");

    setTimeout(() => {
      setStatus("ended");
    }, 700);
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
        <h1>Live Practice Call</h1>

        <p style={{ color: "#667085" }}>
          Scenario: <strong>{scenario.replace("_", " ")}</strong>
        </p>

        {sessionId && (
          <p style={{ color: "#98a2b3", fontSize: "13px" }}>
            Session ID: {sessionId}
          </p>
        )}

        <div
          style={{
            marginTop: "28px",
            padding: "28px",
            borderRadius: "20px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          {status === "connecting" && (
            <>
              <h2>Connecting...</h2>
              <p style={{ color: "#667085" }}>
                Requesting microphone access and preparing the call.
              </p>
            </>
          )}

          {status === "active" && (
            <>
              <h2>Call Active</h2>
              <p style={{ color: "#667085" }}>
                Speak naturally with the AI buyer.
              </p>
            </>
          )}

          {status === "ending" && (
            <>
              <h2>Ending Call...</h2>
              <p style={{ color: "#667085" }}>Saving your session.</p>
            </>
          )}

          {status === "ended" && (
            <>
              <h2>Call Ended</h2>
              <p style={{ color: "#667085" }}>
                Your practice session has ended.
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <h2>Connection Failed</h2>
              <p style={{ color: "#b42318" }}>{error}</p>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          {status === "active" && (
            <button
              onClick={handleEndCall}
              style={{
                padding: "14px 22px",
                borderRadius: "12px",
                border: "none",
                background: "#b42318",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              End Call
            </button>
          )}

          {status === "ended" && (
            <>
              <button
                onClick={() => router.push("/history")}
                style={{
                  padding: "14px 22px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#006b4f",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Go to History
              </button>

              <button
                onClick={() => router.push("/scenarios")}
                style={{
                  padding: "14px 22px",
                  borderRadius: "12px",
                  border: "1px solid #d0d5dd",
                  background: "white",
                  color: "#344054",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Start Another
              </button>
            </>
          )}

          {status === "failed" && (
            <button
              onClick={() => router.push("/scenarios")}
              style={{
                padding: "14px 22px",
                borderRadius: "12px",
                border: "1px solid #d0d5dd",
                background: "white",
                color: "#344054",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Back to Scenarios
            </button>
          )}
        </div>
      </section>
    </AppShell>
  );
}