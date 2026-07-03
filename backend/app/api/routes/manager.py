from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import CurrentAccount, ensure_business_access, require_role
from app.db.client import get_supabase

router = APIRouter()


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


class ManagerBusinessOverviewResponse(BaseModel):
    business: dict[str, Any]
    reps: list[dict[str, Any]]
    rep_count: int


@router.get(
    "/business/{business_id}/team",
    response_model=ManagerBusinessOverviewResponse,
)
async def get_business_team_overview(
    business_id: str,
    current_account: CurrentAccount = Depends(require_role("manager")),
):
    ensure_business_access(current_account.business_id, business_id)

    supabase = get_supabase()

    business_result = (
        supabase.table("business_profiles").select("*").eq("id", business_id).limit(1).execute()
    )
    business_rows = _row_dicts(business_result.data)

    if not business_rows:
        raise HTTPException(status_code=404, detail="Business profile not found")

    team_result = (
        supabase.table("salesperson_accounts")
        .select("id, full_name, phone_number, business_id, role")
        .eq("business_id", business_id)
        .execute()
    )
    reps = _row_dicts(team_result.data)

    return ManagerBusinessOverviewResponse(
        business=business_rows[0],
        reps=reps,
        rep_count=len(reps),
    )
