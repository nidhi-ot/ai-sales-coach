"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";

type CallStatus = "connecting" | "active" | "ending" | "ended" | "failed";
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
  const searchParams = useSearchParams();

  const scenario = searchParams.get("scenario") || "cold_call";

  const [status, setStatus] = useState<CallStatus>("connecting");
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [openaiSessionId, setOpenaiSessionId] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callRunRef = useRef(0);
  const callStartedAtRef = useRef<Date | null>(null);
  const transcriptBufferRef = useRef<TranscriptEntry[]>([]);

  function cleanupCallResources(resources?: {
    dataChannel?: RTCDataChannel | null;
    peerConnection?: RTCPeerConnection | null;
    localStream?: MediaStream | null;
    remoteAudio?: HTMLAudioElement | null;
  }) {
    const dataChannel = resources?.dataChannel ?? dataChannelRef.current;
    const peerConnection =
      resources?.peerConnection ?? peerConnectionRef.current;
    const localStream = resources?.localStream ?? localStreamRef.current;
    const remoteAudio = resources?.remoteAudio ?? remoteAudioRef.current;

    dataChannel?.close();
    peerConnection?.close();

    localStream?.getTracks().forEach((track) => {
      track.stop();
    });

    if (remoteAudio) {
      remoteAudio.pause();
      remoteAudio.srcObject = null;
      remoteAudio.remove();
    }

    if (!resources || dataChannelRef.current === dataChannel) {
      dataChannelRef.current = null;
    }

    if (!resources || peerConnectionRef.current === peerConnection) {
      peerConnectionRef.current = null;
    }

    if (!resources || localStreamRef.current === localStream) {
      localStreamRef.current = null;
    }

    if (!resources || remoteAudioRef.current === remoteAudio) {
      remoteAudioRef.current = null;
    }
  }

  const handleRealtimeEvent = useCallback((event: MessageEvent<string>) => {
    function bufferTranscriptLine(speaker: TranscriptSpeaker, text: string) {
      const trimmedText = text.trim();

      if (!trimmedText) {
        return;
      }

      transcriptBufferRef.current.push({
        speaker,
        text: trimmedText,
        timestamp_offset_ms: callStartedAtRef.current
          ? Date.now() - callStartedAtRef.current.getTime()
          : 0,
      });
    }

    function transcriptFromPayload(payload: RealtimeEventPayload) {
      if (typeof payload.transcript === "string") {
        return payload.transcript;
      }

      if (typeof payload.delta === "string") {
        return payload.delta;
      }

      const content = payload.item?.content;

      if (Array.isArray(content)) {
        for (const entry of content) {
          if (typeof entry?.transcript === "string") {
            return entry.transcript;
          }

          if (typeof entry?.text === "string") {
            return entry.text;
          }
        }
      }

      return null;
    }

    let payload: unknown;

    try {
      payload = JSON.parse(event.data);
    } catch {
      console.debug("Realtime event:", event.data);
      return;
    }

    console.debug("Realtime event:", payload);

    if (!payload || typeof payload !== "object") {
      return;
    }

    const realtimeEvent = payload as RealtimeEventPayload;
    const transcriptText = transcriptFromPayload(realtimeEvent);

    if (
      realtimeEvent.type ===
        "conversation.item.input_audio_transcription.completed" &&
      typeof transcriptText === "string"
    ) {
      bufferTranscriptLine("rep", transcriptText);
    }

    if (
      (realtimeEvent.type === "response.output_audio_transcript.done" ||
        realtimeEvent.type === "response.audio_transcript.done") &&
      typeof transcriptText === "string"
    ) {
      bufferTranscriptLine("ai_customer", transcriptText);
    }
  }, []);

  async function saveTranscriptBatch(sessionIdToSave: string) {
    const entries = transcriptBufferRef.current;

    if (!entries.length) {
      console.warn("No transcript captured; skipping transcript save.");
      return false;
    }

    const response = await fetch(
      `http://127.0.0.1:8000/api/v1/sessions/${sessionIdToSave}/transcripts/batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entries,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Transcript batch save failed with status ${response.status}: ${errorText}`
      );
    }

    return true;
  }

  async function endBackendSession(
    sessionIdToEnd: string,
    endedAt: Date,
    durationSeconds: number,
    endReason: string
  ) {
    const response = await fetch(
      `http://127.0.0.1:8000/api/v1/sessions/${sessionIdToEnd}/end`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds,
          end_reason: endReason,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Backend session end failed with status ${response.status}: ${errorText}`
      );
    }
  }

  useEffect(() => {
    const runId = callRunRef.current + 1;
    callRunRef.current = runId;
    const abortController = new AbortController();
    callStartedAtRef.current = null;
    transcriptBufferRef.current = [];

    let stream: MediaStream | null = null;
    let peerConnection: RTCPeerConnection | null = null;
    let dataChannel: RTCDataChannel | null = null;
    let remoteAudio: HTMLAudioElement | null = null;

    function isCurrentCallRun() {
      return !abortController.signal.aborted && callRunRef.current === runId;
    }

    function cleanupThisRun() {
      cleanupCallResources({
        dataChannel,
        peerConnection,
        localStream: stream,
        remoteAudio,
      });
    }

    async function startCall() {
      try {
        const repId = localStorage.getItem("rep_id");
        const businessId = localStorage.getItem("business_id");

        if (!repId || !businessId) {
          setError("Missing rep or business information. Please login again.");
          setStatus("failed");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        if (!isCurrentCallRun()) {
          cleanupThisRun();
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
            signal: abortController.signal,
          }
        );

        const data = await response.json();

        if (!isCurrentCallRun()) {
          cleanupThisRun();
          return;
        }

        if (!response.ok) {
          setError(data.detail || "Failed to create realtime session.");
          setStatus("failed");
          cleanupThisRun();
          return;
        }

        const clientSecret = data.client_secret;

        if (!clientSecret) {
          setError("Realtime session did not return client_secret.");
          setStatus("failed");
          cleanupThisRun();
          return;
        }

        setSessionId(data.session_id);
        setOpenaiSessionId(data.openai_session_id);
        callStartedAtRef.current = new Date();

        peerConnection = new RTCPeerConnection();
        peerConnectionRef.current = peerConnection;

        remoteAudio = document.createElement("audio");
        remoteAudio.autoplay = true;
        remoteAudioRef.current = remoteAudio;

        peerConnection.ontrack = (event) => {
          if (isCurrentCallRun() && remoteAudio) {
            remoteAudio.srcObject = event.streams[0];
          }
        };

        stream.getTracks().forEach((track) => {
          peerConnection?.addTrack(track, stream as MediaStream);
        });

        dataChannel = peerConnection.createDataChannel("oai-events");
        dataChannelRef.current = dataChannel;

        dataChannel.onopen = () => {
          console.log("Realtime data channel opened");
        };

        dataChannel.onmessage = handleRealtimeEvent;

        dataChannel.onclose = () => {
          console.log("Realtime data channel closed");
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        if (!isCurrentCallRun()) {
          cleanupThisRun();
          return;
        }

        const realtimeResponse = await fetch(
          "https://api.openai.com/v1/realtime/calls",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${clientSecret}`,
              "Content-Type": "application/sdp",
            },
            body: offer.sdp,
            signal: abortController.signal,
          }
        );

        if (!isCurrentCallRun()) {
          cleanupThisRun();
          return;
        }

        if (!realtimeResponse.ok) {
          const errorText = await realtimeResponse.text();
          console.error("OpenAI WebRTC error:", errorText);
          setError("OpenAI WebRTC connection failed.");
          setStatus("failed");
          cleanupThisRun();
          return;
        }

        const answerSdp = await realtimeResponse.text();

        if (!isCurrentCallRun()) {
          cleanupThisRun();
          return;
        }

        await peerConnection.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        });

        if (isCurrentCallRun()) {
          setStatus("active");
        } else {
          cleanupThisRun();
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          cleanupThisRun();
          return;
        }

        console.error(error);
        setError("Microphone or realtime connection failed.");
        setStatus("failed");
        cleanupThisRun();
      }
    }

    startCall();

    return () => {
      abortController.abort();
      cleanupThisRun();
    };
  }, [handleRealtimeEvent, scenario]);

  async function handleEndCall() {
    setStatus("ending");
    setError("");
    callRunRef.current += 1;

    const sessionIdToEnd = sessionId;
    const endedAt = new Date();
    const durationSeconds = callStartedAtRef.current
      ? Math.round((endedAt.getTime() - callStartedAtRef.current.getTime()) / 1000)
      : 0;

    cleanupCallResources();

    if (!sessionIdToEnd) {
      setError("Call ended locally, but no session ID was available to save.");
      setStatus("ended");
      return;
    }

    try {
      await saveTranscriptBatch(sessionIdToEnd);
      await endBackendSession(sessionIdToEnd, endedAt, durationSeconds, "manual");
      localStorage.setItem("last_session_id", sessionIdToEnd);
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "Call ended locally, but saving the transcript failed."
      );
    } finally {
      callStartedAtRef.current = null;
      setStatus("ended");
    }
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
              <p style={{ color: "#667085" }}>
                Saving the transcript and closing the call connection.
              </p>
            </>
          )}

          {status === "ended" && (
            <>
              <h2>Call Ended</h2>
              {error ? (
                <p style={{ color: "#b54708" }}>{error}</p>
              ) : (
                <p style={{ color: "#667085" }}>
                  Your practice session has ended.
                </p>
              )}
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
                onClick={() =>
                  sessionId
                    ? router.push(`/scorecards?session_id=${sessionId}`)
                    : router.push("/history")
                }
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
                View Scorecard
              </button>

              <button
                onClick={() => router.push("/history")}
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
