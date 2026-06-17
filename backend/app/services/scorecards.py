import re
from typing import Any

from app.db.client import get_supabase

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
    return sum(
        len(re.findall(rf"\b{re.escape(word)}\b", normalized)) for word in FILLER_WORDS
    )


def _bounded_score(score: int) -> int:
    return max(1, min(10, score))


def _build_heuristic_feedback(rep_text: str, ai_text: str) -> dict[str, Any]:
    question_count = rep_text.count("?")
    closing_terms = ("next step", "meeting", "book", "schedule", "contract", "start")
    empathy_terms = ("understand", "thanks", "appreciate", "fair", "makes sense")
    objection_terms = ("expensive", "already", "busy", "send", "not interested", "think about")

    rapport_score = 6 + int(any(term in rep_text for term in empathy_terms))
    needs_score = 4 + min(question_count, 4)
    closing_score = 5 + (2 if any(term in rep_text for term in closing_terms) else 0)
    objection_score = 6 if any(term in ai_text for term in objection_terms) else 5

    scores: dict[str, int] = {
        "rapport_score": _bounded_score(rapport_score),
        "needs_discovery_score": _bounded_score(needs_score),
        "objection_handling_score": _bounded_score(objection_score),
        "closing_score": _bounded_score(closing_score),
    }
    scores["overall_score"] = round(sum(scores.values()) / len(scores))

    strengths: list[str] = []
    if question_count:
        strengths.append("Asked discovery questions during the call.")
    if any(term in rep_text for term in empathy_terms):
        strengths.append("Used language that acknowledged the buyer perspective.")
    if any(term in rep_text for term in closing_terms):
        strengths.append("Moved toward a concrete next step.")
    if not strengths:
        strengths.append("Completed the practice call and captured a usable transcript.")

    improvement_areas: list[str] = []
    if question_count < 2:
        improvement_areas.append("Ask more discovery questions before pitching.")
    if not any(term in rep_text for term in closing_terms):
        improvement_areas.append("End with a clearer next-step or closing ask.")
    if _count_filler_words(rep_text) > 3:
        improvement_areas.append("Reduce filler words to sound more concise.")

    return {
        **scores,
        "strengths": strengths,
        "improvement_areas": improvement_areas,
    }


async def create_scorecard_stub(session_id: str, rep_id: str, business_id: str):
    """ Create a scorecard stub with default values for a session.
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
                "rapport_score": 0,
                "needs_discovery_score": 0,
                "objection_handling_score": 0,
                "closing_score": 0,
                "overall_score": 0,
                "strengths": [],
                "improvement_areas": [],
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
        .select("id, rep_id, business_id, duration_seconds")
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
        str(row.get("text") or "")
        for row in transcript_rows
        if row.get("speaker") == "rep"
    )
    ai_text = " ".join(
        str(row.get("text") or "")
        for row in transcript_rows
        if row.get("speaker") == "ai_customer"
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

    feedback = _build_heuristic_feedback(rep_text.lower(), ai_text.lower())
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
        "feedback_summary": (
            "After-call scorecard generated from the saved transcript. "
            "This heuristic pass can be replaced by GPT analysis when the scoring prompt is ready."
        ),
    }

    result = supabase.table("scorecards").upsert(payload, on_conflict="session_id").execute()
    scorecard = _first_row(result.data)
    return scorecard or payload
