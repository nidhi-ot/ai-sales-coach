from typing import Any
from unittest import result

import supabase

from app.db.client import get_supabase

DIMENSION_FIELDS = {
    "objection_handling": "objection_handling_score",
    "discovery": "needs_discovery_score",
    "closing": "closing_score",
}


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

    existing_profile_for_call = _row_dicts(
        supabase.table("salesperson_profiles")
        .select("*")
        .eq("call_id", session_id)
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

    valid_scores = {
        key: float(value) for key, value in metrics.items() if isinstance(value, (int, float))
    }

    weakest_dimension = (
        min(valid_scores.items(), key=lambda item: item[1])[0]
        if valid_scores
        else "objection_handling"
    )

    latest_rows = _row_dicts(
    supabase.table("salesperson_profiles")
    .select("version")
    .eq("rep_id", rep_id)
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
            "business_id": session["business_id"],
            "version": next_version,
            "call_id": session_id,
            "metric_scores": metrics,
            "weakest_dimension": weakest_dimension,
        }
    )
    .execute()
)

    return _first_row(result.data) or {}
