from datetime import datetime
from typing import Any, List, Literal, cast

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db.client import get_supabase
from app.services.scorecards import create_scorecard_stub

router = APIRouter()


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    rows: list[dict[str, Any]] = []
    for item in data:
        if isinstance(item, dict):
            rows.append(item)
    return rows


class SessionStart(BaseModel):
    rep_id: str
    business_id: str
    scenario: Literal["cold_call", "hot_call", "direktforsaljning", "meeting"]


class SessionEnd(BaseModel):
    ended_at: datetime
    duration_seconds: int
    end_reason: str


class TranscriptEntry(BaseModel):
    speaker: Literal["rep", "ai_customer"]
    text: str
    timestamp_offset_ms: int


class TranscriptBatch(BaseModel):
    """
    Accept multiple transcript entries in one request
    instead of sending each line separately.

    Reduces API calls and database writes during
    real-time conversations.
    """

    entries: List[TranscriptEntry]


@router.post("/")
async def create_session(data: SessionStart):
    """Create new practice session."""
    supabase = get_supabase()

    profile = (
        supabase.table("salesperson_profiles")
        .select("version")
        .eq("rep_id", data.rep_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    profile_rows = _row_dicts(profile.data)
    profile_version = int(profile_rows[0]["version"]) if profile_rows else 0

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

    session_rows = _row_dicts(result.data)
    return session_rows[0] if session_rows else {}


@router.patch("/{session_id}/end")
async def end_session(session_id: str, data: SessionEnd):
    """Mark session as completed."""
    """After a session ends, automatically create a
    scorecard stub that will later be populated
    with GPT analysis """
    supabase = get_supabase()

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

    session_rows = _row_dicts(result.data)
    if not session_rows:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_rows[0]
    # Create placeholder scorecard immediately after session completion.
    # Detailed scoring will be added in MS3.
    try:
        await create_scorecard_stub(
            session_id=session_id,
            rep_id=session["rep_id"],
            business_id=session["business_id"],
        )
    except Exception as e:
        print(f"Scorecard creation failed: {e}")

    return session


@router.post("/{session_id}/transcripts")
async def add_transcript_entry(session_id: str, entry: TranscriptEntry):
    """Add transcript entry during/after call."""
    supabase = get_supabase()

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

    transcript_rows = _row_dicts(result.data)
    return transcript_rows[0] if transcript_rows else {}


@router.get("/{session_id}/transcripts")
async def get_transcript(session_id: str):
    """Get full transcript for a session."""
    supabase = get_supabase()

    result = (
        supabase.table("transcripts")
        .select("*")
        .eq("session_id", session_id)
        .order("timestamp_offset_ms")
        .execute()
    )

    return _row_dicts(result.data)


@router.post("/{session_id}/transcripts/batch")
async def add_transcript_batch(session_id: str, batch: TranscriptBatch):
    """
    Store multiple transcript entries in a single
    database operation.

    Frontend buffers transcript chunks and sends
    them together to reduce Supabase write load.
    """

    supabase = get_supabase()

    inserts = [
        {
            "session_id": session_id,
            "speaker": entry.speaker,
            "text": entry.text,
            "timestamp_offset_ms": entry.timestamp_offset_ms,
        }
        for entry in batch.entries
    ]

    # Single bulk insert instead of many individual inserts
    result = supabase.table("transcripts").insert(cast(Any, inserts)).execute()

    inserted_rows = _row_dicts(result.data)
    return {"inserted": len(inserted_rows)}


@router.get("/rep/{rep_id}")
async def get_rep_sessions(rep_id: str, limit: int = 20):
    """Get rep's session history."""
    supabase = get_supabase()

    result = (
        supabase.table("sessions")
        .select("id, scenario, started_at, duration_seconds, status")
        .eq("rep_id", rep_id)
        .order("started_at", desc=True)
        .limit(limit)
        .execute()
    )

    return _row_dicts(result.data)
