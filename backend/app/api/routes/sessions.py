from datetime import datetime, timezone
from typing import Any, List, Literal, cast

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.deps import ensure_rep_access, get_current_user
from app.config import settings
from app.db.client import get_business_profile, get_supabase
from app.models.agent import ScenarioSlug
from app.services.scenarios import get_scenario_config, normalize_framework
from app.services.scorecards import mark_scorecard_processing, run_scorecard_pipeline
from app.services.session_analytics import (
    get_dimension_progress,
    get_recent_sessions,
    get_session_stats,
)

router = APIRouter()


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]


def _require_row_value(row: dict[str, Any], field: str, entity: str) -> str:
    value = row.get(field)
    if value is None:
        raise HTTPException(
            status_code=500,
            detail=f"{entity} is missing {field}",
        )

    return str(value)


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


def _get_owned_session(
    supabase: Any,
    session_id: str,
    current_user_id: str,
) -> dict[str, Any]:
    session_lookup = supabase.table("sessions").select("*").eq("id", session_id).limit(1).execute()
    session_rows = _row_dicts(session_lookup.data)

    if not session_rows:
        raise HTTPException(status_code=404, detail="Session not found")

    session_row = session_rows[0]
    rep_id = _require_row_value(session_row, "rep_id", "Session")
    ensure_rep_access(str(current_user_id), rep_id)
    return session_row


def _validated_duration_seconds(duration_seconds: int) -> int:
    if duration_seconds < 0:
        raise HTTPException(status_code=400, detail="duration_seconds cannot be negative")

    return min(duration_seconds, settings.max_call_seconds)


def _transcript_key(speaker: Any, timestamp_offset_ms: Any) -> tuple[str, int | None]:
    return (str(speaker), timestamp_offset_ms if isinstance(timestamp_offset_ms, int) else None)


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


class TranscriptBatch(BaseModel):
    entries: List[TranscriptEntry]


class SessionHeartbeat(BaseModel):
    heartbeat_at: datetime | None = None


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
    scorecard_status: str | None = None


@router.post("/")
async def create_session(
    data: SessionStart,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    ensure_rep_access(str(current_user.id), data.rep_id)

    profile = (
        supabase.table("salesperson_profiles")
        .select("version")
        .eq("rep_id", data.rep_id)
        .eq("business_id", data.business_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    profile_rows = _row_dicts(profile.data)
    profile_version = int(profile_rows[0]["version"]) if profile_rows else 0
    business_id = data.business_id
    business_profile = await get_business_profile(business_id)
    resolved_framework = normalize_framework(
        business_profile.get("framework") if business_profile else None
    )

    result = (
        supabase.table("sessions")
        .insert(
            {
                "rep_id": data.rep_id,
                "business_id": business_id,
                "scenario": data.scenario.value,
                "profile_version": profile_version,
                "status": "active",
                "metadata": {
                    "system_instruction": data.system_instruction,
                    "framework": resolved_framework,
                    "heartbeat_at": datetime.now(timezone.utc).isoformat(),
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
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()

    _get_owned_session(supabase, session_id, str(current_user.id))
    transcript_entries_saved = 0

    existing_transcript_keys: set[tuple[str, int | None]] = set()

    if data.entries:
        existing_transcripts = _row_dicts(
            supabase.table("transcripts")
            .select("speaker,timestamp_offset_ms")
            .eq("session_id", session_id)
            .execute()
            .data
        )

        existing_transcript_keys = {
            _transcript_key(row.get("speaker"), row.get("timestamp_offset_ms"))
            for row in existing_transcripts
        }
        incoming_transcript_keys: set[tuple[str, int | None]] = set()
        inserts = []

        for entry in data.entries:
            key = _transcript_key(entry.speaker, entry.timestamp_offset_ms)
            if key in existing_transcript_keys or key in incoming_transcript_keys:
                continue

            incoming_transcript_keys.add(key)
            inserts.append(
                {
                    "session_id": session_id,
                    "speaker": entry.speaker,
                    "text": entry.text,
                    "timestamp_offset_ms": entry.timestamp_offset_ms,
                }
            )

        if inserts:
            transcript_result = supabase.table("transcripts").insert(cast(Any, inserts)).execute()
            transcript_entries_saved = len(_row_dicts(transcript_result.data))

    duration_seconds = _validated_duration_seconds(data.duration_seconds)

    supabase.table("sessions").update(
        {
            "status": "completed",
            "ended_at": data.ended_at.isoformat(),
            "duration_seconds": duration_seconds,
        }
    ).eq("id", session_id).execute()

    result = supabase.table("sessions").select("*").eq("id", session_id).limit(1).execute()

    updated_rows = _row_dicts(result.data)
    if not updated_rows:
        raise HTTPException(status_code=404, detail="Session not found")

    updated_session = updated_rows[0]

    score_card = await mark_scorecard_processing(session_id)
    background_tasks.add_task(run_scorecard_pipeline, session_id)

    return {
        "session": updated_session,
        "transcript_entries_saved": transcript_entries_saved,
        "score_card_status": "processing",
        "score_card": score_card,
    }


@router.post("/{session_id}/transcripts")
async def add_transcript_entry(
    session_id: str,
    entry: TranscriptEntry,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    _get_owned_session(supabase, session_id, str(current_user.id))

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
async def get_transcript(
    session_id: str,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    _get_owned_session(supabase, session_id, str(current_user.id))

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
    _get_owned_session(supabase, session_id, str(current_user.id))

    if not batch.entries:
        raise HTTPException(status_code=400, detail="Transcript batch is empty")

    existing_transcripts = _row_dicts(
        supabase.table("transcripts")
        .select("speaker,timestamp_offset_ms")
        .eq("session_id", session_id)
        .execute()
        .data
    )
    existing_transcript_keys = {
        _transcript_key(row.get("speaker"), row.get("timestamp_offset_ms"))
        for row in existing_transcripts
    }
    incoming_transcript_keys: set[tuple[str, int | None]] = set()
    inserts = []

    for entry in batch.entries:
        key = _transcript_key(entry.speaker, entry.timestamp_offset_ms)
        if key in existing_transcript_keys or key in incoming_transcript_keys:
            continue

        incoming_transcript_keys.add(key)
        inserts.append(
            {
                "session_id": session_id,
                "speaker": entry.speaker,
                "text": entry.text,
                "timestamp_offset_ms": entry.timestamp_offset_ms,
            }
        )

    if not inserts:
        return {"inserted": 0}

    result = supabase.table("transcripts").insert(cast(Any, inserts)).execute()
    inserted_rows = _row_dicts(result.data)
    return {"inserted": len(inserted_rows)}


@router.post("/{session_id}/heartbeat")
async def record_session_heartbeat(
    session_id: str,
    data: SessionHeartbeat,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    session_row = _get_owned_session(supabase, session_id, str(current_user.id))
    metadata_value = session_row.get("metadata")
    metadata: dict[str, Any] = metadata_value if isinstance(metadata_value, dict) else {}
    heartbeat_at = data.heartbeat_at or datetime.now(timezone.utc)
    if heartbeat_at.tzinfo is None:
        heartbeat_at = heartbeat_at.replace(tzinfo=timezone.utc)

    next_metadata = {
        **metadata,
        "heartbeat_at": heartbeat_at.astimezone(timezone.utc).isoformat(),
    }

    result = (
        supabase.table("sessions")
        .update({"metadata": next_metadata})
        .eq("id", session_id)
        .execute()
    )
    updated_rows = _row_dicts(result.data)

    if not updated_rows:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "heartbeat_at": next_metadata["heartbeat_at"],
    }


@router.get("/rep/{rep_id}")
async def get_rep_sessions(
    rep_id: str,
    limit: int = 20,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    ensure_rep_access(str(current_user.id), rep_id)

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
            .select("session_id, overall_score, shared_with_manager, status, created_at")
            .in_("session_id", session_ids)
            .order("created_at", desc=True)
            .execute()
        )

        scorecards_by_session = {}
        for row in _row_dicts(scorecard_result.data):
            row_session_id = row.get("session_id")
            if row_session_id and str(row_session_id) not in scorecards_by_session:
                scorecards_by_session[str(row_session_id)] = row

    for row in session_rows:
        scorecard = scorecards_by_session.get(str(row["id"]), {})
        row["overall_score"] = scorecard.get("overall_score")
        row["shared_with_manager"] = bool(scorecard.get("shared_with_manager", False))
        row["scorecard_status"] = scorecard.get("status")
    return session_rows


@router.get("/stats/{rep_id}", response_model=SessionStatsResponse)
async def get_stats(rep_id: str, current_user=Depends(get_current_user)):
    ensure_rep_access(str(current_user.id), rep_id)
    return get_session_stats(rep_id)


@router.get("/recent/{rep_id}", response_model=RecentSessionsResponse)
async def get_recent(
    rep_id: str,
    limit: int = Query(5, ge=1, le=25),
    current_user=Depends(get_current_user),
):
    ensure_rep_access(str(current_user.id), rep_id)
    return {"sessions": get_recent_sessions(rep_id=rep_id, limit=limit)}


@router.get("/dimensions/{rep_id}", response_model=DimensionProgressResponse)
async def get_dimensions(rep_id: str, current_user=Depends(get_current_user)):
    ensure_rep_access(str(current_user.id), rep_id)
    return {"dimensions": get_dimension_progress(rep_id)}


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session_details(
    session_id: str,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()

    session_row = _get_owned_session(supabase, session_id, str(current_user.id))

    transcript_result = (
        supabase.table("transcripts")
        .select("speaker, text, timestamp_offset_ms, created_at")
        .eq("session_id", session_id)
        .order("timestamp_offset_ms")
        .execute()
    )
    transcript_rows = _row_dicts(transcript_result.data)

    scorecard_result = (
        supabase.table("scorecards")
        .select("id, status")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    scorecard_rows = _row_dicts(scorecard_result.data)
    scorecard = scorecard_rows[0] if scorecard_rows else {}
    scorecard_id = str(scorecard["id"]) if scorecard.get("id") else None
    scorecard_status = scorecard.get("status")

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
        "scorecard_status": scorecard_status,
    }
