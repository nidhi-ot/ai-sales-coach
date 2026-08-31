from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import CurrentAccount, get_current_account
from app.db.client import get_supabase

router = APIRouter()


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


@router.get("/me/context")
async def get_my_profile_context(
    current_account: CurrentAccount = Depends(get_current_account),
):
    supabase = get_supabase()

    result = (
        supabase.table("business_profiles")
        .select("name")
        .eq("id", current_account.business_id)
        .limit(1)
        .execute()
    )

    rows = _row_dicts(result.data)

    business_name = ""
    if rows:
        business_name = str(rows[0].get("name") or "")

    return {
        "business_name": business_name,
    }


@router.get("/me/latest")
async def get_latest_salesperson_profile(
    current_account: CurrentAccount = Depends(get_current_account),
):
    supabase = get_supabase()

    result = (
        supabase.table("salesperson_profiles")
        .select("version, weakest_dimension, metric_scores, created_at")
        .eq("rep_id", current_account.id)
        .eq("business_id", current_account.business_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    rows = _row_dicts(result.data)

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No learning profile found",
        )

    return rows[0]


@router.get("/me/scenario-status")
async def get_scenario_status(
    scenario: str,
    current_account: CurrentAccount = Depends(get_current_account),
):
    supabase = get_supabase()

    # Find completed sessions for this rep + business + scenario.
    session_result = (
        supabase.table("sessions")
        .select("id, scenario, started_at")
        .eq("rep_id", current_account.id)
        .eq("business_id", current_account.business_id)
        .eq("scenario", scenario)
        .eq("status", "completed")
        .order("started_at", desc=True)
        .limit(20)
        .execute()
    )

    sessions = _row_dicts(session_result.data)

    if not sessions:
        return {
            "has_history": False,
            "scenario": scenario,
            "version": None,
            "weakest_dimension": None,
            "metric_scores": None,
        }

    session_ids = [str(session["id"]) for session in sessions if session.get("id")]

    if not session_ids:
        return {
            "has_history": False,
            "scenario": scenario,
            "version": None,
            "weakest_dimension": None,
            "metric_scores": None,
        }

    # salesperson_profiles.call_id points back to the practice session.
    profile_result = (
        supabase.table("salesperson_profiles")
        .select("version, weakest_dimension, metric_scores, call_id")
        .eq("rep_id", current_account.id)
        .eq("business_id", current_account.business_id)
        .in_("call_id", session_ids)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    profiles = _row_dicts(profile_result.data)

    if not profiles:
        return {
            "has_history": False,
            "scenario": scenario,
            "version": None,
            "weakest_dimension": None,
            "metric_scores": None,
        }

    profile = profiles[0]

    return {
        "has_history": True,
        "scenario": scenario,
        "version": profile.get("version"),
        "weakest_dimension": profile.get("weakest_dimension"),
        "metric_scores": profile.get("metric_scores"),
    }


@router.get("/me/history")
async def get_profile_history(
    current_account: CurrentAccount = Depends(get_current_account),
):
    supabase = get_supabase()

    result = (
        supabase.table("salesperson_profiles")
        .select("version, metric_scores, weakest_dimension, created_at")
        .eq("rep_id", current_account.id)
        .eq("business_id", current_account.business_id)
        .order("version")
        .execute()
    )

    rows = _row_dicts(result.data)

    return {"profiles": rows}
