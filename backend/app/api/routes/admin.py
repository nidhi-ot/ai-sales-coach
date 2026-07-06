from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import CurrentAccount, require_role
from app.db.client import get_supabase

router = APIRouter()

FRAMEWORK_WARNING = (
    "Changing the framework only affects future sessions and should not be done often."
)


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


class UpdateBusinessFrameworkRequest(BaseModel):
    framework: Literal["BANT", "MEDDIC", "SPIN"]


class UpdateBusinessFrameworkResponse(BaseModel):
    business_id: str
    framework: str
    warning: str


@router.patch(
    "/business/framework",
    response_model=UpdateBusinessFrameworkResponse,
)
async def update_business_framework(
    data: UpdateBusinessFrameworkRequest,
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()

    business_result = (
        supabase.table("business_profiles")
        .select("*")
        .eq("id", current_account.business_id)
        .limit(1)
        .execute()
    )
    business_rows = _row_dicts(business_result.data)

    if not business_rows:
        raise HTTPException(status_code=404, detail="Business profile not found")

    updated_result = (
        supabase.table("business_profiles")
        .update({"framework": data.framework})
        .eq("id", current_account.business_id)
        .execute()
    )
    updated_rows = _row_dicts(updated_result.data)
    updated_business = updated_rows[0] if updated_rows else business_rows[0]

    return UpdateBusinessFrameworkResponse(
        business_id=str(current_account.business_id),
        framework=str(updated_business.get("framework", data.framework)),
        warning=FRAMEWORK_WARNING,
    )
