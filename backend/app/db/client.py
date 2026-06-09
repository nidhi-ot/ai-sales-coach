from supabase import Client, create_client

from app.config import settings


def get_supabase_client() -> Client:
    if not settings.supabase_url:
        raise ValueError("SUPABASE_URL is not configured")

    if not settings.supabase_service_role_key:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY is not configured")

    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


supabase = get_supabase_client()


async def get_latest_profile(rep_id: str):
    """Get rep's latest salesperson profile version."""
    result = (
        supabase.table("salesperson_profiles")
        .select("*")
        .eq("rep_id", rep_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    return result.data[0] if result.data else None


async def create_session(
    rep_id: str,
    business_id: str,
    scenario: str,
    profile_version: int,
):
    """Create new practice session."""
    result = (
        supabase.table("sessions")
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

    return result.data[0]