from datetime import datetime
from typing import Any, List, Literal, cast

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import settings
from app.db.client import get_supabase
from app.models.agent import ScenarioSlug
from app.services.scorecards import analyze_transcript, create_scorecard_stub
from app.services.session_analytics import (
    get_dimension_progress,
    get_recent_sessions,
    get_session_stats,
)

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


class TranscriptEntry(BaseModel):
    speaker: Literal["rep", "ai_customer"]
    text: str
    timestamp_offset_ms: int


class SessionEnd(BaseModel):
    ended_at: datetime
    duration_seconds: int
    end_reason: str
    entries: List[TranscriptEntry] | None = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "ended_at": "2026-06-18T12:00:00Z",
                    "duration_seconds": 180,
                    "end_reason": "manual",
                    "entries": [
                        {
                            "speaker": "rep",
                            "text": "Hello from rep",
                            "timestamp_offset_ms": 1000,
                        }
                    ],
                }
            ]
        }
    }


class TranscriptBatch(BaseModel):
    """
    Accept multiple transcript entries in one request
    instead of sending each line separately.

    Reduces API calls and database writes during
    real-time conversations.
    """

    entries: List[TranscriptEntry]


class SessionStatsResponse(BaseModel):
    total_calls: int
    avg_score: float
    best_score: float
    last_call_date: str | None
    improvement_rate: float


class RecentSessionSummary(BaseModel):
    id: str
    title: str
    scenario: str | None
    score: float | None
    date: str | None
    duration: int | None


class RecentSessionsResponse(BaseModel):
    sessions: list[RecentSessionSummary]


class DimensionProgressItem(BaseModel):
    avg: float
    latest: float | None
    count: int


class DimensionProgressResponse(BaseModel):
    dimensions: dict[str, DimensionProgressItem]


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
@router.post("/{session_id}/end")
@router.patch("/{session_id}/end")
async def end_session(session_id: str, data: SessionEnd):
    """Mark a practice session as completed."""
    supabase = get_supabase()
    session_lookup = supabase.table("sessions").select("*").eq("id", session_id).limit(1).execute()
    session_rows = _row_dicts(session_lookup.data)

    if not session_rows:
        raise HTTPException(status_code=404, detail="Session not found")

    transcript_entries_saved = 0
    if data.entries:
        inserts = [
            {
                "session_id": session_id,
                "speaker": entry.speaker,
                "text": entry.text,
                "timestamp_offset_ms": entry.timestamp_offset_ms,
            }
            for entry in data.entries
        ]
        transcript_result = supabase.table("transcripts").insert(cast(Any, inserts)).execute()
        transcript_entries_saved = len(_row_dicts(transcript_result.data))

    supabase.table("sessions").update(
        {
            "status": "completed",
            "ended_at": data.ended_at.isoformat(),
            "duration_seconds": data.duration_seconds,
        }
    ).eq("id", session_id).execute()

    result = supabase.table("sessions").select("*").eq("id", session_id).limit(1).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    updated_rows = _row_dicts(result.data)
    if not updated_rows:
        raise HTTPException(status_code=404, detail="Session not found")

    session_row = session_rows[0]
    updated_session = updated_rows[0]

    try:
        score_card = await analyze_transcript(session_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        score_card = await create_scorecard_stub(
            session_id=session_id,
            rep_id=str(session_row["rep_id"]),
            business_id=str(session_row["business_id"]),
        )
        return {
            "session": updated_session,
            "transcript_entries_saved": transcript_entries_saved,
            "score_card_status": "pending_transcript",
            "score_card": score_card,
            "detail": str(exc),
        }
    except Exception as exc:
        score_card = await create_scorecard_stub(
            session_id=session_id,
            rep_id=str(session_row["rep_id"]),
            business_id=str(session_row["business_id"]),
        )
        return {
            "session": updated_session,
            "transcript_entries_saved": transcript_entries_saved,
            "score_card_status": "analysis_failed",
            "score_card": score_card,
            "detail": str(exc),
        }

    return {
        "session": updated_session,
        "transcript_entries_saved": transcript_entries_saved,
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
    """Get rep's session history with score summaries."""
    supabase = get_supabase()

    result = (
        supabase.table("sessions")
        .select("id, scenario, started_at, duration_seconds, status")
        .eq("rep_id", rep_id)
        .order("started_at", desc=True)
        .limit(limit)
        .execute()
    )

    session_rows = _row_dicts(result.data)
    session_ids = [str(row["id"]) for row in session_rows if row.get("id")]

    scorecards_by_session: dict[str, dict[str, Any]] = {}

    if session_ids:
        scorecard_result = (
            supabase.table("scorecards")
            .select("session_id, overall_score, shared_with_manager")
            .in_("session_id", session_ids)
            .execute()
        )

        scorecards_by_session = {
            str(row["session_id"]): row
            for row in _row_dicts(scorecard_result.data)
            if row.get("session_id")
        }

    for row in session_rows:
        scorecard = scorecards_by_session.get(str(row["id"]), {})
        row["overall_score"] = scorecard.get("overall_score")
        row["shared_with_manager"] = bool(scorecard.get("shared_with_manager", False))

    return session_rows


@router.get("/stats/{rep_id}", response_model=SessionStatsResponse)
async def get_stats(rep_id: str):
    """Get the session statistics for given rep_id"""
    return get_session_stats(rep_id)


@router.get("/recent/{rep_id}", response_model=RecentSessionsResponse)
async def get_recent(
    rep_id: str,
    limit: int = Query(5, ge=1, le=25),
):
    """Get the recent sessions for given rep_id"""
    return {"sessions": get_recent_sessions(rep_id=rep_id, limit=limit)}


@router.get("/dimensions/{rep_id}", response_model=DimensionProgressResponse)
async def get_dimensions(rep_id: str):
    return {"dimensions": get_dimension_progress(rep_id)}
