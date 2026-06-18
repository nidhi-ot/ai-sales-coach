from datetime import datetime
from typing import Any, List, Literal, cast

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.db.client import get_supabase
from app.models.agent import ScenarioSlug
from app.services.scorecards import analyze_transcript

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
    scenario: ScenarioSlug
    system_instruction: str


class SessionEnd(BaseModel):
    ended_at: datetime
    duration_seconds: int
    end_reason: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "ended_at": "2026-06-18T12:00:00Z",
                    "duration_seconds": 180,
                    "end_reason": "manual",
                }
            ]
        }
    }


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


# Manual session creation only. Live WebRTC calls should start with
# POST /api/v1/realtime/session so they receive OpenAI credentials.
@router.post("/")
async def create_session(data: SessionStart):
    """Create a manual/non-realtime practice session."""
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
                "business_id": settings.business_id,
                "scenario": data.scenario.value,
                "profile_version": profile_version,
                "status": "active",
                "metadata": {
                    "system_instruction": data.system_instruction,
                },
            }
        )
        .execute()
    )

    session_rows = _row_dicts(result.data)
    return session_rows[0] if session_rows else {}


# Live and manual sessions both use this endpoint when the call is finished.
@router.patch("/{session_id}/end")
async def end_session(session_id: str, data: SessionEnd):
    """Mark a practice session as completed."""
    try:
        score_card = await analyze_transcript(session_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze transcript for scorecard",
        ) from exc

    if not score_card:
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze transcript for scorecard",
        )

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

    return {
        "session": session_rows[0],
        "score_card_status": "generated",
        "score_card": score_card,
    }


@router.post("/{session_id}/transcripts")
async def add_transcript_entry(session_id: str, entry: TranscriptEntry):
    """Add transcript entry after call."""
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

    if not batch.entries:
        raise HTTPException(status_code=400, detail="Transcript batch is empty")

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
