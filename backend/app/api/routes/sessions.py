from datetime import datetime
from typing import Any, List, Literal, cast

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.authz import current_rep_id, get_owned_session, require_same_rep_id
from app.api.deps import get_current_user
from app.config import settings
from app.db.client import get_supabase
from app.models.agent import ScenarioSlug
from app.services.scenarios import get_scenario_config
from app.services.scorecards import analyze_transcript, create_scorecard_stub
from app.services.session_analytics import (
    create_next_salesperson_profile,
    get_dimension_progress,
    get_recent_sessions,
    get_session_stats,
)

router = APIRouter()


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]


def _format_datetime(value: Any) -> str | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, str):
        normalized_value = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized_value).isoformat()
        except ValueError:
            return value

    return str(value)


class SessionStart(BaseModel):
    rep_id: str | None = None
    business_id: str | None = None
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


class TranscriptBatch(BaseModel):
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


class SessionDetailTranscriptEntry(BaseModel):
    speaker: Literal["rep", "ai_customer"]
    text: str
    timestamp_offset_ms: int | None = None
    created_at: str | None = None


class SessionDetailResponse(BaseModel):
    id: str
    title: str
    status: str | None = None
    created_at: str | None = None
    ended_at: str | None = None
    transcript: list[SessionDetailTranscriptEntry]
    duration: int | None = None
    scenario: str | None = None
    scorecard_id: str | None = None


@router.post("/")
async def create_session(data: SessionStart, current_user=Depends(get_current_user)):
    supabase = get_supabase()
    rep_id = current_rep_id(current_user)

    profile = (
        supabase.table("salesperson_profiles")
        .select("version")
        .eq("rep_id", rep_id)
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
                "rep_id": rep_id,
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


@router.post("/{session_id}/end")
@router.patch("/{session_id}/end")
async def end_session(
    session_id: str,
    data: SessionEnd,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    rep_id = current_rep_id(current_user)
    session_row = get_owned_session(supabase, session_id=session_id, rep_id=rep_id)
    transcript_entries_saved = 0
    profile = None

    existing_transcripts = _row_dicts(
        supabase.table("transcripts")
        .select("id")
        .eq("session_id", session_id)
        .limit(1)
        .execute()
        .data
    )

    if data.entries and not existing_transcripts:
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
    ).eq("id", session_id).eq("rep_id", rep_id).execute()

    result = (
        supabase.table("sessions")
        .select("*")
        .eq("id", session_id)
        .eq("rep_id", rep_id)
        .limit(1)
        .execute()
    )

    updated_rows = _row_dicts(result.data)
    if not updated_rows:
        raise HTTPException(status_code=404, detail="Session not found")

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
            "profile": profile,
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
            "profile": profile,
            "detail": str(exc),
        }

    profile_status = "generated"
    profile_detail = None

    try:
        profile = await create_next_salesperson_profile(session_id, score_card)
    except Exception as exc:
        profile_status = "failed"
        profile_detail = str(exc)

    return {
        "session": updated_session,
        "transcript_entries_saved": transcript_entries_saved,
        "score_card_status": "generated",
        "score_card": score_card,
        "profile": profile,
        "profile_status": profile_status,
        "profile_detail": profile_detail,
    }


@router.post("/{session_id}/transcripts")
async def add_transcript_entry(
    session_id: str,
    entry: TranscriptEntry,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    get_owned_session(
        supabase,
        session_id=session_id,
        rep_id=current_rep_id(current_user),
    )

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
async def get_transcript(session_id: str, current_user=Depends(get_current_user)):
    supabase = get_supabase()
    get_owned_session(
        supabase,
        session_id=session_id,
        rep_id=current_rep_id(current_user),
    )

    result = (
        supabase.table("transcripts")
        .select("*")
        .eq("session_id", session_id)
        .order("timestamp_offset_ms")
        .execute()
    )

    return _row_dicts(result.data)


@router.post("/{session_id}/transcripts/batch")
async def add_transcript_batch(
    session_id: str,
    batch: TranscriptBatch,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    get_owned_session(
        supabase,
        session_id=session_id,
        rep_id=current_rep_id(current_user),
    )

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

    result = supabase.table("transcripts").insert(cast(Any, inserts)).execute()
    inserted_rows = _row_dicts(result.data)
    return {"inserted": len(inserted_rows)}


def _get_rep_sessions(rep_id: str, limit: int = 20):
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
            .select("session_id, overall_score, shared_with_manager, created_at")
            .in_("session_id", session_ids)
            .order("created_at", desc=True)
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


@router.get("/me")
async def get_my_sessions(limit: int = 20, current_user=Depends(get_current_user)):
    return _get_rep_sessions(rep_id=current_rep_id(current_user), limit=limit)


@router.get("/rep/{rep_id}")
async def get_rep_sessions(
    rep_id: str,
    limit: int = 20,
    current_user=Depends(get_current_user),
):
    return _get_rep_sessions(
        rep_id=require_same_rep_id(rep_id, current_user),
        limit=limit,
    )


@router.get("/me/stats", response_model=SessionStatsResponse)
async def get_my_stats(current_user=Depends(get_current_user)):
    return get_session_stats(current_rep_id(current_user))


@router.get("/stats/{rep_id}", response_model=SessionStatsResponse)
async def get_stats(rep_id: str, current_user=Depends(get_current_user)):
    return get_session_stats(require_same_rep_id(rep_id, current_user))


@router.get("/me/recent", response_model=RecentSessionsResponse)
async def get_my_recent(
    limit: int = Query(5, ge=1, le=25),
    current_user=Depends(get_current_user),
):
    return {"sessions": get_recent_sessions(rep_id=current_rep_id(current_user), limit=limit)}


@router.get("/recent/{rep_id}", response_model=RecentSessionsResponse)
async def get_recent(
    rep_id: str,
    limit: int = Query(5, ge=1, le=25),
    current_user=Depends(get_current_user),
):
    return {
        "sessions": get_recent_sessions(
            rep_id=require_same_rep_id(rep_id, current_user),
            limit=limit,
        )
    }


@router.get("/me/dimensions", response_model=DimensionProgressResponse)
async def get_my_dimensions(current_user=Depends(get_current_user)):
    return {"dimensions": get_dimension_progress(current_rep_id(current_user))}


@router.get("/dimensions/{rep_id}", response_model=DimensionProgressResponse)
async def get_dimensions(rep_id: str, current_user=Depends(get_current_user)):
    return {"dimensions": get_dimension_progress(require_same_rep_id(rep_id, current_user))}


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session_details(session_id: str, current_user=Depends(get_current_user)):
    supabase = get_supabase()
    session_row = get_owned_session(
        supabase,
        session_id=session_id,
        rep_id=current_rep_id(current_user),
    )

    transcript_result = (
        supabase.table("transcripts")
        .select("speaker, text, timestamp_offset_ms, created_at")
        .eq("session_id", session_id)
        .order("timestamp_offset_ms")
        .execute()
    )
    transcript_rows = _row_dicts(transcript_result.data)

    scorecard_result = (
        supabase.table("scorecards").select("id").eq("session_id", session_id).limit(1).execute()
    )
    scorecard_rows = _row_dicts(scorecard_result.data)
    scorecard_id = str(scorecard_rows[0]["id"]) if scorecard_rows else None

    try:
        title = get_scenario_config(str(session_row.get("scenario"))).title
    except Exception:
        scenario_value = session_row.get("scenario")
        title = str(scenario_value).replace("_", " ").title() if scenario_value else "Unknown"

    return {
        "id": str(session_row.get("id")),
        "title": title,
        "status": session_row.get("status"),
        "created_at": _format_datetime(session_row.get("started_at")),
        "ended_at": _format_datetime(session_row.get("ended_at")),
        "transcript": [
            {
                "speaker": row.get("speaker"),
                "text": row.get("text"),
                "timestamp_offset_ms": row.get("timestamp_offset_ms"),
                "created_at": _format_datetime(row.get("created_at")),
            }
            for row in transcript_rows
        ],
        "duration": session_row.get("duration_seconds"),
        "scenario": session_row.get("scenario"),
        "scorecard_id": scorecard_id,
    }
