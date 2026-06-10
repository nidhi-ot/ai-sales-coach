from datetime import datetime
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db.client import supabase

router = APIRouter()


class SessionStart(BaseModel):
    rep_id: str
    business_id: str
    scenario: Literal["cold_call", "hot_call", "direktforsaljning", "meeting"]


class SessionEnd(BaseModel):
    ended_at: datetime
    duration_seconds: int


class TranscriptEntry(BaseModel):
    speaker: Literal["rep", "ai_customer"]
    text: str
    timestamp_offset_ms: int


@router.post("/")
async def create_session(data: SessionStart):
    """Create new practice session."""
    profile = (
        supabase.table("salesperson_profiles")
        .select("version")
        .eq("rep_id", data.rep_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    profile_version = profile.data[0]["version"] if profile.data else 0

    result = (
        supabase.table("sessions")
        .insert(
            {
                "rep_id": data.rep_id,
                "business_id": data.business_id,
                "scenario": data.scenario,
                "profile_version": profile_version,
                "status": "active",
            }
        )
        .execute()
    )

    return result.data[0]


@router.patch("/{session_id}/end")
async def end_session(session_id: str, data: SessionEnd):
    """Mark session as completed."""
    result = (
        supabase.table("sessions")
        .update(
            {
                "status": "completed",
                "ended_at": data.ended_at.isoformat(),
                "duration_seconds": data.duration_seconds,
            }
        )
        .eq("id", session_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    return result.data[0]


@router.post("/{session_id}/transcripts")
async def add_transcript_entry(session_id: str, entry: TranscriptEntry):
    """Add transcript entry during/after call."""
    result = (
        supabase.table("transcripts")
        .insert(
            {
                "session_id": session_id,
                "speaker": entry.speaker,
                "text": entry.text,
                "timestamp_offset_ms": entry.timestamp_offset_ms,
            }
        )
        .execute()
    )

    return result.data[0]


@router.get("/{session_id}/transcripts")
async def get_transcript(session_id: str):
    """Get full transcript for a session."""
    result = (
        supabase.table("transcripts")
        .select("*")
        .eq("session_id", session_id)
        .order("timestamp_offset_ms")
        .execute()
    )

    return result.data


@router.get("/rep/{rep_id}")
async def get_rep_sessions(rep_id: str, limit: int = 20):
    """Get rep's session history."""
    result = (
        supabase.table("sessions")
        .select("id, scenario, started_at, duration_seconds, status")
        .eq("rep_id", rep_id)
        .order("started_at", desc=True)
        .limit(limit)
        .execute()
    )

    return result.data