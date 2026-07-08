from typing import Any

from supabase import Client, create_client

from app.config import settings

_supabase: Client | None = None
_supabase_auth: Client | None = None


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


def get_supabase_auth() -> Client:
    """Create a browser-like auth client so login does not mutate the service client."""
    global _supabase_auth

    if _supabase_auth is None:
        if not settings.supabase_url or not settings.supabase_anon_key:
            raise RuntimeError("Supabase URL and anon key must be configured")

        _supabase_auth = create_client(
            settings.supabase_url,
            settings.supabase_anon_key,
        )

    return _supabase_auth


def _first(data: list[Any] | None) -> dict[str, Any] | None:
    if not data:
        return None

    first_item = data[0]
    return first_item if isinstance(first_item, dict) else None


async def get_latest_profile(rep_id: str, business_id: str):
    """Get rep's latest salesperson profile version for a business."""
    result = (
        get_supabase()
        .table("salesperson_profiles")
        .select("*")
        .eq("rep_id", rep_id)
        .eq("business_id", business_id)
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
    metadata: dict[str, Any] | None = None,
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
                "metadata": metadata or {},
            }
        )
        .execute()
    )

    return _first(result.data)


async def check_supabase_connection():
    """Check that Supabase is reachable with the configured service role."""
    table_query = get_supabase().table("business_profiles").select("id").limit(1)
    result = table_query.execute()

    return {
        "status": "ok",
        "table": "business_profiles",
        "row_count": len(result.data or []),
    }
