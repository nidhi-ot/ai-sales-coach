import re
from typing import Any

from app.db.client import get_supabase
from app.services.gpt_scoring import gpt_analyze_transcript

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


async def create_scorecard_stub(session_id: str, rep_id: str, business_id: str):
    """Create a scorecard stub with default values for a session.
    This can be used to ensure a scorecard record exists before the transcript is fully processed.
    The stub can then be updated with real analysis results once the transcript is available.
    """
    supabase = get_supabase()
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
                "feedback_summary": "Analysis pending (stub).",
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

    feedback = await gpt_analyze_transcript(
        rep_text=rep_text,
        ai_text=ai_text,
        system_instruction=session.get("metadata", {}).get("system_instruction") or "",
        scenario_title=session.get("scenario") or "unknown",
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
    }

    result = supabase.table("scorecards").upsert(payload, on_conflict="session_id").execute()
    scorecard = _first_row(result.data)
    return scorecard or payload
