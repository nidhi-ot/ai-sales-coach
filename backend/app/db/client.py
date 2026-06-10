from typing import Any

from supabase import Client, create_client

from app.config import settings

_supabase: Client | None = None


def get_supabase() -> Client:
    global _supabase

    if _supabase is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError("Supabase URL and service role key must be configured")

        _supabase = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    return _supabase


def _first(data: list[dict[str, Any]] | None) -> dict[str, Any] | None:
    return data[0] if data else None


async def get_latest_profile(rep_id: str):
    """Get rep's latest salesperson profile version."""
    result = (
        get_supabase()
        .table("salesperson_profiles")
        .select("*")
        .eq("rep_id", rep_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    return _first(result.data)


async def get_business_profile(business_id: str):
    """Get business profile configuration for prompt assembly."""
    result = (
        get_supabase()
        .table("business_profiles")
        .select("*")
        .eq("id", business_id)
        .limit(1)
        .execute()
    )

    return _first(result.data)


async def create_session(
    rep_id: str,
    business_id: str,
    scenario: str,
    profile_version: int,
):
    """Create new practice session."""
    result = (
        get_supabase()
        .table("sessions")
        .insert(
            {
                "rep_id": rep_id,
                "business_id": business_id,
                "scenario": scenario,
                "profile_version": profile_version,
                "status": "active",
            }
        )
        .execute()
    )

    return _first(result.data)
