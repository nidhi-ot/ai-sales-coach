import re
from datetime import datetime, timezone
from typing import Any

from app.db.client import get_supabase
from app.services.gpt_scoring import gpt_analyze_transcript
from app.services.scenarios import normalize_framework
from app.services.session_analytics import create_next_salesperson_profile

FILLER_WORDS = {
    "actually",
    "basically",
    "er",
    "hm",
    "like",
    "literally",
    "um",
    "uh",
    "you know",
}

SCORECARD_STATUS_PROCESSING = "processing"
SCORECARD_STATUS_GENERATED = "generated"
SCORECARD_STATUS_FAILED = "failed"
STUB_FEEDBACK_SUMMARY = "Analysis pending (stub)."
PROCESSING_FEEDBACK_SUMMARY = "Analysis processing."
FAILED_FEEDBACK_SUMMARY = (
    "Analysis failed. Reprocess this scorecard after transcripts are available."
)


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


def _first_row(data: Any) -> dict[str, Any] | None:
    rows = _row_dicts(data)
    return rows[0] if rows else None


def _word_count(text: str) -> int:
    return len(re.findall(r"\b[\w']+\b", text.lower()))


def _count_filler_words(text: str) -> int:
    normalized = text.lower()
    return sum(len(re.findall(rf"\b{re.escape(word)}\b", normalized)) for word in FILLER_WORDS)


def _session_metadata(session: dict[str, Any]) -> dict[str, Any]:
    metadata = session.get("metadata")
    return metadata if isinstance(metadata, dict) else {}


def is_stub_scorecard(scorecard: dict[str, Any]) -> bool:
    return (
        scorecard.get("overall_score") is None
        or scorecard.get("feedback_summary") == STUB_FEEDBACK_SUMMARY
    )


def _scorecard_base_payload(
    session_id: str,
    rep_id: str,
    business_id: str,
    *,
    status: str,
    feedback_summary: str,
    error_message: str | None = None,
) -> dict[str, Any]:
    return {
        "session_id": session_id,
        "rep_id": rep_id,
        "business_id": business_id,
        "call_duration_seconds": 0,
        "rep_talk_percentage": 0.0,
        "interruptions_count": 0,
        "filler_words_count": 0,
        "rapport_score": None,
        "needs_discovery_score": None,
        "objection_handling_score": None,
        "closing_score": None,
        "overall_score": None,
        "strengths": [],
        "improvement_areas": [],
        "framework_scores": {},
        "feedback_summary": feedback_summary,
        "status": status,
        "error_message": error_message,
        "processing_started_at": (
            datetime.now(timezone.utc).isoformat()
            if status == SCORECARD_STATUS_PROCESSING
            else None
        ),
    }


def _get_session_for_scorecard(supabase: Any, session_id: str) -> dict[str, Any]:
    session = _first_row(
        supabase.table("sessions")
        .select("id, rep_id, business_id, duration_seconds")
        .eq("id", session_id)
        .limit(1)
        .execute()
        .data
    )
    if not session:
        raise LookupError("Session not found")

    return session


async def mark_scorecard_processing(session_id: str) -> dict[str, Any]:
    supabase = get_supabase()
    session = _get_session_for_scorecard(supabase, session_id)
    payload = _scorecard_base_payload(
        session_id=session_id,
        rep_id=str(session["rep_id"]),
        business_id=str(session["business_id"]),
        status=SCORECARD_STATUS_PROCESSING,
        feedback_summary=PROCESSING_FEEDBACK_SUMMARY,
    )

    duration_seconds = session.get("duration_seconds")
    if isinstance(duration_seconds, int):
        payload["call_duration_seconds"] = duration_seconds

    result = supabase.table("scorecards").upsert(payload, on_conflict="session_id").execute()
    return _first_row(result.data) or payload


async def mark_scorecard_failed(session_id: str, error_message: str) -> dict[str, Any]:
    supabase = get_supabase()
    session = _get_session_for_scorecard(supabase, session_id)
    existing = _first_row(
        supabase.table("scorecards")
        .select("*")
        .eq("session_id", session_id)
        .limit(1)
        .execute()
        .data
    )

    if existing:
        existing_summary = existing.get("feedback_summary")
        feedback_summary = (
            existing_summary
            if existing_summary
            and existing_summary not in {PROCESSING_FEEDBACK_SUMMARY, STUB_FEEDBACK_SUMMARY}
            else FAILED_FEEDBACK_SUMMARY
        )

        result = (
            supabase.table("scorecards")
            .update(
                {
                    "status": SCORECARD_STATUS_FAILED,
                    "error_message": error_message,
                    "feedback_summary": feedback_summary,
                    "processing_started_at": None,
                }
            )
            .eq("session_id", session_id)
            .execute()
        )
        return _first_row(result.data) or existing

    payload = _scorecard_base_payload(
        session_id=session_id,
        rep_id=str(session["rep_id"]),
        business_id=str(session["business_id"]),
        status=SCORECARD_STATUS_FAILED,
        feedback_summary=FAILED_FEEDBACK_SUMMARY,
        error_message=error_message,
    )
    result = supabase.table("scorecards").upsert(payload, on_conflict="session_id").execute()
    return _first_row(result.data) or payload


async def create_scorecard_stub(session_id: str, rep_id: str, business_id: str):
    """Create a scorecard stub with default values for a session.
    This can be used to ensure a scorecard record exists before the transcript is fully processed.
    The stub can then be updated with real analysis results once the transcript is available.
    """
    supabase = get_supabase()
    existing = _first_row(
        supabase.table("scorecards")
        .select("*")
        .eq("session_id", session_id)
        .limit(1)
        .execute()
        .data
    )
    if existing:
        return existing

    result = (
        supabase.table("scorecards")
        .upsert(
            {
                "session_id": session_id,
                "rep_id": rep_id,
                "business_id": business_id,
                "call_duration_seconds": 0,
                "rep_talk_percentage": 0.0,
                "interruptions_count": 0,
                "filler_words_count": 0,
                "rapport_score": None,
                "needs_discovery_score": None,
                "objection_handling_score": None,
                "closing_score": None,
                "overall_score": None,
                "strengths": [],
                "improvement_areas": [],
                "framework_scores": {},
                "feedback_summary": STUB_FEEDBACK_SUMMARY,
                "status": SCORECARD_STATUS_FAILED,
                "error_message": "Scorecard is a stub and has not been analyzed.",
            },
            on_conflict="session_id",
        )
        .execute()
    )

    return result.data[0]


async def analyze_transcript(session_id: str) -> dict[str, Any]:
    """Create an after-call scorecard from the transcript saved for a session."""
    supabase = get_supabase()

    session = _first_row(
        supabase.table("sessions")
        .select("id, rep_id, business_id, duration_seconds, scenario, metadata")
        .eq("id", session_id)
        .limit(1)
        .execute()
        .data
    )
    if not session:
        raise LookupError("Session not found")

    transcript_rows = _row_dicts(
        supabase.table("transcripts")
        .select("speaker, text, timestamp_offset_ms")
        .eq("session_id", session_id)
        .order("timestamp_offset_ms")
        .execute()
        .data
    )
    if not transcript_rows:
        raise ValueError("Transcript must be saved before scorecard analysis")

    rep_text = " ".join(
        str(row.get("text") or "") for row in transcript_rows if row.get("speaker") == "rep"
    )
    ai_text = " ".join(
        str(row.get("text") or "") for row in transcript_rows if row.get("speaker") == "ai_customer"
    )
    rep_words = _word_count(rep_text)
    ai_words = _word_count(ai_text)
    total_words = rep_words + ai_words
    talk_percentage = round((rep_words / total_words) * 100, 2) if total_words else 0.0

    duration_seconds = session.get("duration_seconds")
    if not isinstance(duration_seconds, int):
        timestamp_offsets: list[int] = []
        for row in transcript_rows:
            timestamp_offset = row.get("timestamp_offset_ms")
            if isinstance(timestamp_offset, int):
                timestamp_offsets.append(timestamp_offset)

        last_offset_ms = max(timestamp_offsets, default=0)
        duration_seconds = round(last_offset_ms / 1000)

    # Defensive check - session should not be None due to earlier guard
    if session is None:
        raise LookupError("Session became None unexpectedly")

    metadata = _session_metadata(session)
    framework = normalize_framework(metadata.get("framework") if metadata else None)
    business_profile = _first_row(
        supabase.table("business_profiles")
        .select("products, icp, objections")
        .eq("id", session["business_id"])
        .limit(1)
        .execute()
        .data
    )

    feedback = await gpt_analyze_transcript(
        rep_text=rep_text,
        ai_text=ai_text,
        system_instruction=metadata.get("system_instruction") or "",
        scenario_title=session.get("scenario") or "unknown",
        business_profile=business_profile,
        framework=framework,
    )

    framework_score = feedback.get("framework_scores", {})

    payload: dict[str, Any] = {
        "session_id": session_id,
        "rep_id": session["rep_id"],
        "business_id": session["business_id"],
        "call_duration_seconds": duration_seconds,
        "rep_talk_percentage": talk_percentage,
        "interruptions_count": 0,
        "filler_words_count": _count_filler_words(rep_text),
        "rapport_score": feedback["rapport_score"],
        "needs_discovery_score": feedback["needs_discovery_score"],
        "objection_handling_score": feedback["objection_handling_score"],
        "closing_score": feedback["closing_score"],
        "overall_score": feedback["overall_score"],
        "strengths": feedback["strengths"],
        "improvement_areas": feedback["improvement_areas"],
        "framework_scores": framework_score,
        "feedback_summary": feedback["feedback_summary"],
        "status": SCORECARD_STATUS_GENERATED,
        "error_message": None,
        "processing_started_at": None,
    }

    result = supabase.table("scorecards").upsert(payload, on_conflict="session_id").execute()
    scorecard = _first_row(result.data)
    return scorecard or payload


async def run_scorecard_pipeline(session_id: str) -> dict[str, Any] | None:
    """Generate a scorecard and next profile outside the end-call request."""

    try:
        scorecard = await analyze_transcript(session_id)
    except Exception as exc:
        await mark_scorecard_failed(session_id, str(exc))
        return None

    try:
        await create_next_salesperson_profile(session_id, scorecard)
    except Exception:
        # Profile generation is downstream learning-loop work. A valid scorecard
        # should remain generated even if profile versioning needs a later retry.
        pass

    return scorecard
