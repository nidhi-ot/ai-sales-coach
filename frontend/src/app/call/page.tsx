"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";

type CallStatus = "connecting" | "active" | "ending" | "ended" | "failed";

export default function CallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scenario = searchParams.get("scenario") || "cold_call";

  const [status, setStatus] = useState<CallStatus>("connecting");
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [openaiSessionId, setOpenaiSessionId] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  function stopCallResources() {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;

    peerConnectionRef.current?.getSenders().forEach((sender) => {
      sender.track?.stop();
    });

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    localStreamRef.current = null;
  }

  useEffect(() => {
    let cancelled = false;

    async function startCall() {
      try {
        const repId = localStorage.getItem("rep_id");
        const businessId = localStorage.getItem("business_id");

        if (!repId || !businessId) {
          setError("Missing rep or business information. Please login again.");
          setStatus("failed");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;

        const response = await fetch(
          "http://127.0.0.1:8000/api/v1/realtime/session",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              scenario,
              rep_id: repId,
              business_id: businessId,
              vad: {
                threshold: 0.5,
                silence_duration_ms: 500,
              },
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.detail || "Failed to create realtime session.");
          setStatus("failed");
          stopCallResources();
          return;
        }

        const clientSecret = data.client_secret;

        if (!clientSecret) {
          setError("Realtime session did not return client_secret.");
          setStatus("failed");
          stopCallResources();
          return;
        }

        if (cancelled) {
          stopCallResources();
          return;
        }

        setSessionId(data.session_id);
        setOpenaiSessionId(data.openai_session_id);

        const peerConnection = new RTCPeerConnection();
        peerConnectionRef.current = peerConnection;

        const remoteAudio = document.createElement("audio");
        remoteAudio.autoplay = true;

        peerConnection.ontrack = (event) => {
          remoteAudio.srcObject = event.streams[0];
        };

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        const dataChannel = peerConnection.createDataChannel("oai-events");
        dataChannelRef.current = dataChannel;

        dataChannel.onopen = () => {
          console.log("Realtime data channel opened");
        };

        dataChannel.onmessage = (event) => {
          console.log("Realtime event:", event.data);
        };

        dataChannel.onclose = () => {
          console.log("Realtime data channel closed");
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        const realtimeResponse = await fetch(
          "https://api.openai.com/v1/realtime/calls",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${clientSecret}`,
              "Content-Type": "application/sdp",
            },
            body: offer.sdp,
          }
        );

        if (!realtimeResponse.ok) {
          const errorText = await realtimeResponse.text();
          console.error("OpenAI WebRTC error:", errorText);
          setError("OpenAI WebRTC connection failed.");
          setStatus("failed");
          stopCallResources();
          return;
        }

        const answerSdp = await realtimeResponse.text();

        await peerConnection.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        });

        if (cancelled) {
          stopCallResources();
          return;
        }

        setStatus("active");
      } catch (error) {
        console.error(error);
        setError("Microphone or realtime connection failed.");
        setStatus("failed");
        stopCallResources();
      }
    }

    startCall();

    return () => {
      cancelled = true;
      stopCallResources();
    };
  }, [scenario]);

  function handleEndCall() {
    setStatus("ending");
    stopCallResources();

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

        {openaiSessionId && (
          <p style={{ color: "#98a2b3", fontSize: "13px" }}>
            OpenAI Session ID: {openaiSessionId}
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
                Requesting microphone access and connecting to realtime AI.
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
              <p style={{ color: "#667085" }}>Closing the call connection.</p>
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