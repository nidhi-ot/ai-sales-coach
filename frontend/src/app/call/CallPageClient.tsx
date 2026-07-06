"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { API_BASE_URL, authFetch } from "../../lib/api";

type CallStatus =
  | "ready"
  | "connecting"
  | "active"
  | "holding"
  | "ending"
  | "ended"
  | "failed";

type TranscriptSpeaker = "rep" | "ai_customer";

type TranscriptEntry = {
  speaker: TranscriptSpeaker;
  text: string;
  timestamp_offset_ms: number;
};

type RealtimeEventPayload = {
  type?: string;
  transcript?: unknown;
  delta?: unknown;
  item?: {
    content?: Array<{
      transcript?: unknown;
      text?: unknown;
    }>;
  };
};

export default function CallPage() {
  const router = useRouter();
  const [scenario, setScenario] = useState("cold_call");
  const [businessContext, setBusinessContext] = useState(
    "apartment_association"
  );
  const [focusArea, setFocusArea] = useState("handling_objections");
  const [isMuted, setIsMuted] = useState(false);

  const [status, setStatus] = useState<CallStatus>("ready");
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [openaiSessionId, setOpenaiSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [maxCallSeconds, setMaxCallSeconds] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const autoEndTriggeredRef = useRef(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const callRunRef = useRef(0);
  const callStartedAtRef = useRef<Date | null>(null);
  const transcriptBufferRef = useRef<TranscriptEntry[]>([]);
  const transcriptFlushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptFlushInFlightRef = useRef(false);
  const transcriptFlushPromiseRef = useRef<Promise<void> | null>(null);

  const flushTranscriptBuffer = useCallback(async () => {
    const sessionToFlush = sessionId;
    const pendingEntries = transcriptBufferRef.current;

    if (!sessionToFlush || pendingEntries.length === 0) {
      return;
    }

    if (transcriptFlushInFlightRef.current && transcriptFlushPromiseRef.current) {
      await transcriptFlushPromiseRef.current;
      return;
    }

    transcriptFlushInFlightRef.current = true;
    transcriptBufferRef.current = [];

    const flushPromise = (async () => {
      try {
        const response = await authFetch(
          `${API_BASE_URL}/sessions/${sessionToFlush}/transcripts/batch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              entries: pendingEntries,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Transcript flush failed:", errorText);
          transcriptBufferRef.current = [...pendingEntries, ...transcriptBufferRef.current];
        }
      } catch (error) {
        console.error("Transcript flush failed:", error);
        transcriptBufferRef.current = [...pendingEntries, ...transcriptBufferRef.current];
      }
    })();

    transcriptFlushPromiseRef.current = flushPromise;

    try {
      await flushPromise;
    } finally {
      transcriptFlushInFlightRef.current = false;
      transcriptFlushPromiseRef.current = null;
    }
  }, [sessionId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setScenario(params.get("scenario") || "cold_call");
    setBusinessContext(
      params.get("business_context") || "apartment_association"
    );
    setFocusArea(params.get("focus_area") || "handling_objections");
  }, []);

  function cleanupCallResources() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    dataChannelRef.current?.close();
    dataChannelRef.current = null;

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    localStreamRef.current = null;

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.remove();
      remoteAudioRef.current = null;
    }
  }

  const handleRealtimeEvent = useCallback((event: MessageEvent<string>) => {
    function bufferTranscriptLine(speaker: TranscriptSpeaker, text: string) {
      const trimmedText = text.trim();
      if (!trimmedText) return;

      transcriptBufferRef.current.push({
        speaker,
        text: trimmedText,
        timestamp_offset_ms: callStartedAtRef.current
          ? Date.now() - callStartedAtRef.current.getTime()
          : 0,
      });
    }

    let payload: unknown;

    try {
      payload = JSON.parse(event.data);
    } catch {
      console.debug("Realtime raw event:", event.data);
      return;
    }

    if (!payload || typeof payload !== "object") return;

    const realtimeEvent = payload as RealtimeEventPayload;

    if (
      realtimeEvent.type ===
        "conversation.item.input_audio_transcription.completed" &&
      typeof realtimeEvent.transcript === "string"
    ) {
      bufferTranscriptLine("rep", realtimeEvent.transcript);
    }

    if (
      realtimeEvent.type === "response.audio_transcript.done" &&
      typeof realtimeEvent.transcript === "string"
    ) {
      bufferTranscriptLine("ai_customer", realtimeEvent.transcript);
    }

    if (
      realtimeEvent.type === "response.output_audio_transcript.done" &&
      typeof realtimeEvent.transcript === "string"
    ) {
      bufferTranscriptLine("ai_customer", realtimeEvent.transcript);
    }
  }, []);

  async function endBackendSession(
    sessionIdToEnd: string,
    endedAt: Date,
    durationSeconds: number,
    endReason: string,
    entries: TranscriptEntry[]
  ) {
    const response = await authFetch(
      `${API_BASE_URL}/sessions/${sessionIdToEnd}/end`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds,
          end_reason: endReason,
          entries,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Backend session end failed with status ${response.status}: ${errorText}`
      );
    }

    return response.json();
  }

  async function startCall() {
    setStatus("connecting");
    setError("");
    setSessionId(null);
    setOpenaiSessionId(null);
    setElapsedSeconds(0);
    setMaxCallSeconds(null);
    setCountdownSeconds(null);
    setIsMuted(false);

    callRunRef.current += 1;
    const runId = callRunRef.current;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    callStartedAtRef.current = null;
    transcriptBufferRef.current = [];
    autoEndTriggeredRef.current = false;

    function isCurrentCallRun() {
      return !abortController.signal.aborted && callRunRef.current === runId;
    }

    try {
      const repId = localStorage.getItem("rep_id");
      const businessId = localStorage.getItem("business_id");

      if (!repId || !businessId) {
        setError("Missing rep or business information. Please login again.");
        setStatus("failed");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!isCurrentCallRun()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      localStreamRef.current = stream;

      const response = await authFetch(`${API_BASE_URL}/realtime/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario,
          rep_id: repId,
          business_id: businessId,
          business_context: businessContext,
          focus_area: focusArea,
          vad: {
            threshold: 0.5,
            silence_duration_ms: 500,
          },
        }),
        signal: abortController.signal,
      });

      const data = await response.json();
      if (typeof data.max_call_seconds === "number") {
        setMaxCallSeconds(data.max_call_seconds);
        setCountdownSeconds(data.max_call_seconds);
      }

      if (!isCurrentCallRun()) {
        cleanupCallResources();
        return;
      }

      if (!response.ok) {
        setError(data.detail || "Failed to create realtime session.");
        setStatus("failed");
        cleanupCallResources();
        return;
      }

      const clientSecret = data.client_secret;

      if (!clientSecret) {
        setError("Realtime session did not return client_secret.");
        setStatus("failed");
        cleanupCallResources();
        return;
      }

      setSessionId(data.session_id);
      setOpenaiSessionId(data.openai_session_id);
      callStartedAtRef.current = new Date();

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      const remoteAudio = document.createElement("audio");
      remoteAudio.autoplay = true;
      remoteAudioRef.current = remoteAudio;

      peerConnection.ontrack = (event) => {
        if (isCurrentCallRun()) {
          remoteAudio.srcObject = event.streams[0];
        }
      };

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      dataChannel.onmessage = handleRealtimeEvent;

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const realtimeResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
        signal: abortController.signal,
      });

      if (!realtimeResponse.ok) {
        const errorText = await realtimeResponse.text();
        console.error("OpenAI WebRTC error:", errorText);
        setError("OpenAI WebRTC connection failed.");
        setStatus("failed");
        cleanupCallResources();
        return;
      }

      const answerSdp = await realtimeResponse.text();

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setStatus("active");
    } catch (error) {
      if (abortController.signal.aborted) {
        cleanupCallResources();
        return;
      }

      console.error(error);
      setError("Microphone or realtime connection failed.");
      setStatus("failed");
      cleanupCallResources();
    }
  }

  function holdCall() {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });

    setStatus("holding");
  }

  function toggleMute() {
    const audioTracks = localStreamRef.current?.getAudioTracks();
    if (!audioTracks || audioTracks.length === 0) return;

    setIsMuted((currentMutedState) => {
      const newMutedState = !currentMutedState;

      audioTracks.forEach((track) => {
        track.enabled = !newMutedState;
      });

      return newMutedState;
    });
  }

  function resumeCall() {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });

    setStatus("active");
  }

    async function handleEndCall(endReason: "manual" | "timeout" = "manual") {
      setStatus("ending");
      setError("");
      setIsMuted(false);
      callRunRef.current += 1;
      autoEndTriggeredRef.current = true;

      const sessionIdToEnd = sessionId;
      const endedAt = new Date();
      const durationSeconds = callStartedAtRef.current
        ? Math.round((endedAt.getTime() - callStartedAtRef.current.getTime()) / 1000)
        : 0;

      cleanupCallResources();

      if (!sessionIdToEnd) {
        setStatus("ended");
        return;
      }

      try {
        await flushTranscriptBuffer();

        const entries = [...transcriptBufferRef.current];

        await endBackendSession(
          sessionIdToEnd,
          endedAt,
          durationSeconds,
          endReason,
          entries
        );
        localStorage.setItem("last_session_id", sessionIdToEnd);
      } catch (error) {
        console.error(error);
        setError(
          error instanceof Error
            ? error.message
            : "Call ended locally, but ending the backend session failed."
        );
      } finally {
        callStartedAtRef.current = null;
        transcriptBufferRef.current = [];
        setStatus("ended");
        setIsMuted(false);
        setCountdownSeconds(null);
        setMaxCallSeconds(null);
      }
    }

    useEffect(() => {
        if (status !== "active" && status !== "holding") {
          if (transcriptFlushTimerRef.current) {
            clearInterval(transcriptFlushTimerRef.current);
            transcriptFlushTimerRef.current = null;
          }
          return;
        }

        transcriptFlushTimerRef.current = setInterval(() => {
          void flushTranscriptBuffer();
        }, 15000);

        return () => {
          if (transcriptFlushTimerRef.current) {
            clearInterval(transcriptFlushTimerRef.current);
            transcriptFlushTimerRef.current = null;
          }
        };
      }, [status, sessionId, flushTranscriptBuffer]);

    useEffect(() => {
      let timer: ReturnType<typeof setInterval> | null = null;

      if (status === "active" || status === "holding") {
        timer = setInterval(() => {
          if (callStartedAtRef.current) {
            const nextElapsedSeconds = Math.floor(
              (Date.now() - callStartedAtRef.current.getTime()) / 1000
            );

            setElapsedSeconds(nextElapsedSeconds);

            if (maxCallSeconds !== null) {
              const nextCountdownSeconds = Math.max(
                0,
                maxCallSeconds - nextElapsedSeconds
              );

              setCountdownSeconds(nextCountdownSeconds);

              if (nextCountdownSeconds === 0 && !autoEndTriggeredRef.current) {
                autoEndTriggeredRef.current = true;
                void handleEndCall("timeout");
              }
            }
          }
        }, 1000);
      }

      return () => {
        if (timer) clearInterval(timer);
      };
    }, [status, maxCallSeconds]);

  useEffect(() => {
    const handlePageHide = () => {
      const pendingEntries = transcriptBufferRef.current;

      if (!sessionId || pendingEntries.length === 0) {
        return;
      }

      transcriptBufferRef.current = [];

      void authFetch(`${API_BASE_URL}/sessions/${sessionId}/transcripts/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entries: pendingEntries,
        }),
        keepalive: true,
      }).catch((error) => {
        console.error("Transcript flush failed:", error);
        transcriptBufferRef.current = pendingEntries;
      });
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [sessionId]);

  useEffect(() => {
    return () => {
      callRunRef.current += 1;
      cleanupCallResources();
    };
  }, []);

  const statusLabel =
    status === "ready"
      ? "Ready"
      : status === "connecting"
        ? "Connecting"
        : status === "active"
          ? "Connected"
          : status === "holding"
            ? "On Hold"
            : status === "ending"
              ? "Ending"
              : status === "ended"
                ? "Ended"
                : "Failed";

  return (
    <AppShell>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Live Practice</p>
            <h1 style={heroTitleStyle}>Live Practice Call</h1>
            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <span style={pillStyle}>Scenario: {scenario.replace("_", " ")}</span>
              <span style={pillStyle}>Status: {statusLabel}</span>
            </div>
          </div>

          <div
            style={{
              ...timerBoxStyle,
              ...(countdownSeconds !== null && countdownSeconds <= 60
                ? { borderColor: "#f79009", background: "#fffaeb" }
                : {}),
            }}
          >
            <p style={{ margin: 0, color: "#667085", fontSize: "13px" }}>
              Time Left
            </p>
            <strong
              style={{
                fontSize: "24px",
                color: countdownSeconds !== null && countdownSeconds <= 60 ? "#b54708" : undefined,
              }}
            >
              {countdownSeconds !== null ? formatTime(countdownSeconds) : formatTime(elapsedSeconds)}
            </strong>
          </div>
        </section>

        <section style={callPanelStyle}>
          <div style={avatarWrapStyle}>
            <div style={avatarStyle}>
              {status === "active"
                ? "🎙️"
                : status === "holding"
                  ? "⏸️"
                  : status === "ended"
                    ? "✅"
                    : status === "failed"
                      ? "⚠️"
                      : "🤖"}
            </div>

            <h2 style={{ margin: "18px 0 8px" }}>
              {status === "ready" && "Ready to Start"}
              {status === "connecting" && "Connecting..."}
              {status === "active" && "AI Customer is Listening"}
              {status === "holding" && "Call On Hold"}
              {status === "ending" && "Ending Call..."}
              {status === "ended" && "Call Ended"}
              {status === "failed" && "Connection Failed"}
            </h2>

            <p style={{ color: status === "failed" ? "#b42318" : "#667085" }}>
              {status === "ready" &&
                "Click Start Call when you are ready. Microphone permission will be requested after that."}
              {status === "connecting" &&
                "Creating realtime session and connecting audio."}
              {status === "active" &&
                "Speak naturally with the AI buyer. Your conversation is being captured for the scorecard."}
              {status === "holding" &&
                "Your microphone is muted. Resume when ready."}
              {status === "ending" &&
                "Saving the transcript and closing the call connection."}
              {status === "ended" &&
                (error || "Your practice session has ended.")}
              {status === "failed" && error}
            </p>

            {status === "ended" && (
              <div style={savedBoxStyle}>
                ✅ Your practice session has been saved successfully.
              </div>
            )}
          </div>

          <div style={controlBarStyle}>
            {status === "ready" && (
              <button onClick={startCall} style={primaryButton}>
                ▶ Start Call
              </button>
            )}

            {status === "active" && (
              <>
                <button
                  onClick={toggleMute}
                  style={{
                    ...secondaryButton,
                    ...(isMuted
                      ? { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }
                      : {}),
                  }}
                >
                  {isMuted ? "🔇 Unmute" : "🎙️ Mute"}
                </button>
                <button onClick={holdCall} style={secondaryButton}>
                  ⏸ Hold
                </button>
                <button onClick={() => handleEndCall("manual")} style={dangerButton}>
                  ⛔ End Call
                </button>
              </>
            )}

            {status === "holding" && (
              <>
                <button onClick={resumeCall} style={primaryButton}>
                  ▶ Resume
                </button>
                <button onClick={() => handleEndCall("manual")} style={dangerButton}>
                  ⛔ End Call
                </button>
              </>
            )}

            {status === "ended" && (
              <>
                <button
                  onClick={() =>
                    sessionId
                      ? router.replace(`/scorecards?session_id=${sessionId}`)
                      : router.replace("/history")
                  }
                  style={primaryButton}
                >
                  View Scorecard
                </button>

                <button onClick={() => router.push("/history")} style={secondaryButton}>
                  Go to History
                </button>

                <button
                  onClick={() => router.push("/scenarios")}
                  style={secondaryButton}
                >
                  Start Another
                </button>
              </>
            )}

            {status === "failed" && (
              <button
                onClick={() => router.push("/scenarios")}
                style={secondaryButton}
              >
                Back to Scenarios
              </button>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
  border: "1px solid #dfeee8",
  borderRadius: "28px",
  padding: "34px",
  boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
  marginBottom: "26px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
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
  fontWeight: 800,
  color: "#101828",
};

const pillStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "white",
  border: "1px solid #dfeee8",
  color: "#344054",
  fontWeight: 700,
  fontSize: "13px",
};

const timerBoxStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #dfeee8",
  borderRadius: "18px",
  padding: "16px 22px",
  minWidth: "120px",
  textAlign: "center",
};

const callPanelStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "28px",
  padding: "34px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
};

const avatarWrapStyle: React.CSSProperties = {
  padding: "52px 32px",
  borderRadius: "26px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  textAlign: "center",
};

const avatarStyle: React.CSSProperties = {
  width: "116px",
  height: "116px",
  borderRadius: "999px",
  background: "#e7f4ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
  fontSize: "48px",
  boxShadow: "0 16px 30px rgba(0, 107, 79, 0.12)",
};

const savedBoxStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "14px 18px",
  borderRadius: "14px",
  background: "#f0fdf4",
  color: "#166534",
  fontWeight: 700,
  display: "inline-block",
};

const controlBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "14px",
  marginTop: "28px",
  flexWrap: "wrap",
};

const primaryButton: React.CSSProperties = {
  padding: "14px 24px",
  borderRadius: "14px",
  border: "none",
  background: "#006b4f",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(0, 107, 79, 0.22)",
};

const secondaryButton: React.CSSProperties = {
  padding: "14px 24px",
  borderRadius: "14px",
  border: "1px solid #d0d5dd",
  background: "white",
  color: "#344054",
  fontWeight: 800,
  cursor: "pointer",
};

const dangerButton: React.CSSProperties = {
  padding: "14px 24px",
  borderRadius: "14px",
  border: "none",
  background: "#b42318",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};
