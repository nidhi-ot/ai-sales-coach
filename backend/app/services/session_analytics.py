import json
from typing import Any, Literal

from openai import AsyncOpenAI
from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.db.client import get_supabase


DIMENSION_FIELDS = {
    "objection_handling": "objection_handling_score",
    "discovery": "needs_discovery_score",
    "closing": "closing_score",
}


LearningDimension = Literal["rapport", "discovery", "objection_handling", "closing"]


class ProfileLearningAnalysis(BaseModel):
    weakest_dimension: LearningDimension
    reasoning_summary: str
    evidence: list[str] = Field(default_factory=list)

    @field_validator("evidence", mode="before")
    @classmethod
    def _coerce_evidence(cls, value: Any) -> list[str]:
        if value is None:
            return []

        if not isinstance(value, list):
            return [str(value)]

        return [str(item) for item in value if item is not None]


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    """Convert Supabase data to a list"""
    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


def _first_row(data: Any) -> dict[str, Any] | None:
    if isinstance(data, dict):
        return data

    rows = _row_dicts(data)
    return rows[0] if rows else None


def _as_float(value: Any) -> float | None:
    """Convert to float value"""
    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _average(values: list[float]) -> float:
    """Calculate the average of a list of float values"""
    return round(sum(values) / len(values), 2) if values else 0.0


def _scenario_title(scenario: Any) -> str:
    """Convert scenario to a readable title"""
    if not scenario:
        return "Unknown Scenario"

    return str(scenario).replace("_", " ").title()


def get_session_stats(rep_id: str) -> dict[str, Any]:
    """Get session statistics for a given rep_id."""

    supabase = get_supabase()
    session_rows = _row_dicts(
        supabase.table("sessions")
        .select("id", "started_at")
        .eq("rep_id", rep_id)
        .eq("status", "completed")
        .order("started_at", desc=True)
        .execute()
        .data
    )

    scorecard_rows = _row_dicts(
        supabase.table("scorecards")
        .select("overall_score", "created_at")
        .eq("rep_id", rep_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )

    scores = []

    for row in scorecard_rows:
        score = _as_float(row.get("overall_score"))
        if score is not None:
            scores.append(score)

    improvement_rate = 0.0
    if len(scores) > 1 and scores[-1] != 0:
        improvement_rate = round(((scores[0] - scores[-1]) / scores[-1]) * 100, 2)

    return {
        "total_calls": len(session_rows),
        "avg_score": _average(scores),
        "best_score": round(max(scores), 2) if scores else 0.0,
        "last_call_date": session_rows[0].get("started_at") if session_rows else None,
        "improvement_rate": improvement_rate,
    }


def get_recent_sessions(rep_id: str, limit: int = 5) -> list[dict[str, Any]]:
    """Retrieves recent session for given rep_id including scorecard"""
    supabase = get_supabase()

    session_rows = _row_dicts(
        supabase.table("sessions")
        .select("id, scenario, started_at, duration_seconds")
        .eq("rep_id", rep_id)
        .eq("status", "completed")
        .order("started_at", desc=True)
        .limit(limit)
        .execute()
        .data
    )

    session_ids = [str(row["id"]) for row in session_rows if row.get("id")]
    scorecards_by_session: dict[str, dict[str, Any]] = {}

    if session_ids:
        scorecard_rows = _row_dicts(
            supabase.table("scorecards")
            .select("session_id, overall_score, call_duration_seconds")
            .in_("session_id", session_ids)
            .execute()
            .data
        )

        scorecards_by_session = {
            str(row["session_id"]): row for row in scorecard_rows if row.get("session_id")
        }

    recent_sessions = []
    for row in session_rows:
        session_id = str(row["id"])
        scorecard = scorecards_by_session.get(session_id, {})

        recent_sessions.append(
            {
                "id": session_id,
                "title": _scenario_title(row.get("scenario")),
                "scenario": row.get("scenario"),
                "score": _as_float(scorecard.get("overall_score")),
                "date": row.get("started_at"),
                "duration": row.get("duration_seconds") or scorecard.get("call_duration_seconds"),
            }
        )

    return recent_sessions

def get_recent_learning_history(
    rep_id: str,
    business_id: str,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Load recent completed calls with scorecards and transcripts for learning analysis."""
    bounded_limit = max(5, min(limit, 15))
    supabase = get_supabase()

    session_rows = _row_dicts(
        supabase.table("sessions")
        .select("id, scenario, started_at, duration_seconds")
        .eq("rep_id", rep_id)
        .eq("business_id", business_id)
        .eq("status", "completed")
        .order("started_at", desc=True)
        .limit(bounded_limit)
        .execute()
        .data
    )

    session_ids = [str(row["id"]) for row in session_rows if row.get("id")]

    if not session_ids:
        return []

    scorecard_rows = _row_dicts(
        supabase.table("scorecards")
        .select(
            "session_id, overall_score, rapport_score, needs_discovery_score, "
            "objection_handling_score, closing_score, strengths, improvement_areas, "
            "feedback_summary, moments"
        )
        .in_("session_id", session_ids)
        .execute()
        .data
    )

    scorecards_by_session = {
        str(row["session_id"]): row for row in scorecard_rows if row.get("session_id")
    }

    transcript_rows = _row_dicts(
        supabase.table("transcripts")
        .select("session_id, speaker, text, timestamp_offset_ms")
        .in_("session_id", session_ids)
        .order("timestamp_offset_ms")
        .execute()
        .data
    )

    transcripts_by_session: dict[str, list[dict[str, Any]]] = {
        session_id: [] for session_id in session_ids
    }

    for row in transcript_rows:
        session_id = str(row.get("session_id") or "")

        if session_id not in transcripts_by_session:
            continue

        transcripts_by_session[session_id].append(
            {
                "speaker": row.get("speaker"),
                "text": str(row.get("text") or ""),
                "timestamp_offset_ms": row.get("timestamp_offset_ms"),
            }
        )

    history = []

    for session in session_rows:
        session_id = str(session["id"])

        history.append(
            {
                "session_id": session_id,
                "scenario": session.get("scenario"),
                "started_at": session.get("started_at"),
                "duration_seconds": session.get("duration_seconds"),
                "scorecard": scorecards_by_session.get(session_id, {}),
                "transcript": transcripts_by_session.get(session_id, []),
            }
        )

    return history

def get_dimension_progress(rep_id: str) -> dict[str, dict[str, Any]]:
    """Get progress for each dimensions from the scorecard"""
    supabase = get_supabase()

    scorecard_rows = _row_dicts(
        supabase.table("scorecards")
        .select("objection_handling_score, needs_discovery_score, " "closing_score, created_at")
        .eq("rep_id", rep_id)
        .order("created_at")
        .execute()
        .data
    )

    dimensions: dict[str, dict[str, Any]] = {}

    for dimension_key, score_field in DIMENSION_FIELDS.items():
        values = []

        for row in scorecard_rows:
            score = _as_float(row.get(score_field))
            if score is not None:
                values.append(score)

        dimensions[dimension_key] = {
            "avg": _average(values),
            "latest": round(values[-1], 2) if values else None,
            "count": len(values),
        }

    return dimensions


def _deterministic_profile_analysis(metrics: dict[str, Any]) -> ProfileLearningAnalysis:
    valid_scores = {
        key: float(value) for key, value in metrics.items() if isinstance(value, (int, float))
    }

    weakest_dimension = (
        min(valid_scores.items(), key=lambda item: item[1])[0]
        if valid_scores
        else "objection_handling"
    )

    evidence = [f"{key}={score:g}" for key, score in valid_scores.items()]

    return ProfileLearningAnalysis(
        weakest_dimension=weakest_dimension,
        reasoning_summary="Selected the lowest available score from the latest scorecard.",
        evidence=evidence,
    )


def _parse_profile_learning_analysis(response_text: str) -> ProfileLearningAnalysis:
    response_text = response_text.strip()

    if response_text.startswith("```json"):
        response_text = response_text[7:]
    elif response_text.startswith("```"):
        response_text = response_text[3:]

    if response_text.endswith("```"):
        response_text = response_text[:-3]

    return ProfileLearningAnalysis.model_validate(json.loads(response_text.strip()))


async def _request_ai_profile_analysis(
    *,
    scorecard: dict[str, Any],
    history: list[dict[str, Any]],
) -> ProfileLearningAnalysis:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY not configured in settings")

    client = AsyncOpenAI(api_key=settings.openai_api_key)

    prompt = f"""Analyze this sales rep's recent practice history.

Choose the single weakest skill to focus next. Use exactly one of:
rapport, discovery, objection_handling, closing

Current scorecard:
{json.dumps(scorecard, default=str)}

Recent call history:
{json.dumps(history, default=str)}

Return only valid JSON:
{{
  "weakest_dimension": "rapport|discovery|objection_handling|closing",
  "reasoning_summary": "short explanation",
  "evidence": ["specific evidence from scorecards or transcripts"]
}}"""

    response = await client.chat.completions.create(
        model=settings.openai_profile_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert sales coach. Identify the rep's next learning focus "
                    "from historical scorecards and transcript evidence. Return valid JSON only."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_completion_tokens=700,
    )

    content = response.choices[0].message.content

    if content is None:
        raise ValueError("GPT returned empty profile analysis")

    return _parse_profile_learning_analysis(content)


async def create_next_salesperson_profile(
    session_id: str,
    scorecard: dict[str, Any],
) -> dict[str, Any]:
    supabase = get_supabase()

    session_rows = _row_dicts(
        supabase.table("sessions")
        .select("id, rep_id, business_id")
        .eq("id", session_id)
        .limit(1)
        .execute()
        .data
    )

    if not session_rows:
        raise LookupError("Session not found")

    session = session_rows[0]
    rep_id = session["rep_id"]
    business_id = session["business_id"]

    existing_profile_for_call = _row_dicts(
        supabase.table("salesperson_profiles")
        .select("*")
        .eq("call_id", session_id)
        .eq("business_id", business_id)
        .limit(1)
        .execute()
        .data
    )

    if existing_profile_for_call:
        return existing_profile_for_call[0]

    metrics = {
        "rapport": scorecard.get("rapport_score"),
        "discovery": scorecard.get("needs_discovery_score"),
        "objection_handling": scorecard.get("objection_handling_score"),
        "closing": scorecard.get("closing_score"),
    }

    analysis = _deterministic_profile_analysis(metrics)

    if settings.ai_profile_update_enabled:
        try:
            history = get_recent_learning_history(rep_id, business_id)
            analysis = await _request_ai_profile_analysis(
                scorecard=scorecard,
                history=history,
            )
        except Exception:
            pass

    weakest_dimension = analysis.weakest_dimension

    latest_rows = _row_dicts(
        supabase.table("salesperson_profiles")
        .select("version")
        .eq("rep_id", rep_id)
        .eq("business_id", business_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
        .data
    )

    latest_version = int(latest_rows[0]["version"]) if latest_rows else 0
    next_version = latest_version + 1

    result = (
        supabase.table("salesperson_profiles")
        .insert(
            {
                "rep_id": rep_id,
                "business_id": business_id,
                "version": next_version,
                "call_id": session_id,
                "metric_scores": metrics,
                "weakest_dimension": weakest_dimension,
            }
        )
        .execute()
    )

    return _first_row(result.data) or {}
