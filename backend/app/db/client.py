from supabase import Client, create_client

from app.config import settings


supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key,
)


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