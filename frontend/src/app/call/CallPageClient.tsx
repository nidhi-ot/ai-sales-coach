"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import { API_BASE_URL } from "../../lib/api";


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
  const searchParams = useSearchParams();

  const scenario = searchParams.get("scenario") || "cold_call";

  const businessContext =
  searchParams.get("business_context") || "apartment_association";

const framework =
  searchParams.get("framework") || "BANT";

const focusArea =
  searchParams.get("focus_area") || "handling_objections";

  const [status, setStatus] = useState<CallStatus>("ready");
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [openaiSessionId, setOpenaiSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const callRunRef = useRef(0);
  const callStartedAtRef = useRef<Date | null>(null);
  const transcriptBufferRef = useRef<TranscriptEntry[]>([]);

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
    realtimeEvent.type === "conversation.item.input_audio_transcription.completed" &&
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
    const response = await fetch(
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

    callRunRef.current += 1;
    const runId = callRunRef.current;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    callStartedAtRef.current = null;
    transcriptBufferRef.current = [];

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

      const response = await fetch(
        `${API_BASE_URL}/realtime/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scenario,
            rep_id: repId,
            business_id: businessId,
            business_context: businessContext,
            framework,
            focus_area: focusArea,
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

  function resumeCall() {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });

    setStatus("active");
  }

  async function handleEndCall() {
    setStatus("ending");
    setError("");
    callRunRef.current += 1;

    const sessionIdToEnd = sessionId;
    const endedAt = new Date();
    const durationSeconds = callStartedAtRef.current
      ? Math.round((endedAt.getTime() - callStartedAtRef.current.getTime()) / 1000)
      : 0;
    const entries = [...transcriptBufferRef.current];

    cleanupCallResources();

    if (!sessionIdToEnd) {
      setStatus("ended");
      return;
    }

    try {
      await endBackendSession(
        sessionIdToEnd,
        endedAt,
        durationSeconds,
        "manual",
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
    }
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (status === "active" || status === "holding") {
      timer = setInterval(() => {
        if (callStartedAtRef.current) {
          setElapsedSeconds(
            Math.floor((Date.now() - callStartedAtRef.current.getTime()) / 1000)
          );
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);

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
}