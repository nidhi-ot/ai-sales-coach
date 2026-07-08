import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import CurrentAccount, require_role
from app.config import settings
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


class CreateInviteRequest(BaseModel):
    email: str
    role: Literal["rep", "manager", "admin"] = "rep"
    expires_in_days: int = Field(default=7, gt=0, le=30)


class CreateInviteResponse(BaseModel):
    invite_id: str
    email: str
    business_id: str
    role: str
    token: str
    registration_link: str
    expires_at: str
    warning: str

class BusinessProfileResponse(BaseModel):
    business_id: str
    name: str | None = None
    products: str | None = None
    icp: str | None = None
    objections: str | None = None
    language: str | None = None
    framework: str | None = None
    framework_warning: str


class UpdateBusinessProfileRequest(BaseModel):
    name: str | None = None
    products: str | None = None
    icp: str | None = None
    objections: str | None = None
    language: str | None = None

class ScenarioConfigResponse(BaseModel):
    business_id: str
    scenario_slug: str
    title: str | None = None
    objective: str | None = None
    persona_notes: str | None = None


class UpdateScenarioConfigRequest(BaseModel):
    title: str | None = None
    objective: str | None = None
    persona_notes: str | None = None


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

    if getattr(updated_result, "error", None):
        raise HTTPException(status_code=500, detail=str(updated_result.error))

    updated_rows = _row_dicts(updated_result.data)
    updated_business = updated_rows[0] if updated_rows else business_rows[0]

    return UpdateBusinessFrameworkResponse(
        business_id=str(current_account.business_id),
        framework=str(updated_business.get("framework", data.framework)),
        warning=FRAMEWORK_WARNING,
    )

@router.get(
    "/business",
    response_model=BusinessProfileResponse,
)
async def get_business_profile(
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()

    result = (
        supabase.table("business_profiles")
        .select("*")
        .eq("id", current_account.business_id)
        .limit(1)
        .execute()
    )

    rows = _row_dicts(result.data)

    if not rows:
        raise HTTPException(status_code=404, detail="Business profile not found")

    business = rows[0]

    return BusinessProfileResponse(
        business_id=str(business.get("id")),
        name=business.get("name"),
        products=business.get("products"),
        icp=business.get("icp"),
        objections=business.get("objections"),
        language=business.get("language"),
        framework=business.get("framework"),
        framework_warning=FRAMEWORK_WARNING,
    )

@router.patch(
    "/business",
    response_model=BusinessProfileResponse,
)
async def update_business_profile(
    data: UpdateBusinessProfileRequest,
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()

    result = (
        supabase.table("business_profiles")
        .select("*")
        .eq("id", current_account.business_id)
        .limit(1)
        .execute()
    )

    rows = _row_dicts(result.data)

    if not rows:
        raise HTTPException(status_code=404, detail="Business profile not found")

    update_data = {
        key: value
        for key, value in data.model_dump().items()
        if value is not None
    }

    updated_result = (
        supabase.table("business_profiles")
        .update(update_data)
        .eq("id", current_account.business_id)
        .execute()
    )

    updated_rows = _row_dicts(updated_result.data)
    business = updated_rows[0] if updated_rows else rows[0]

    return BusinessProfileResponse(
        business_id=str(business.get("id")),
        name=business.get("name"),
        products=business.get("products"),
        icp=business.get("icp"),
        objections=business.get("objections"),
        language=business.get("language"),
        framework=business.get("framework"),
        framework_warning=FRAMEWORK_WARNING,
    )


@router.post(
    "/invites",
    response_model=CreateInviteResponse,
)
async def create_invite(
    data: CreateInviteRequest,
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()

    business_result = (
        supabase.table("business_profiles")
        .select("id")
        .eq("id", current_account.business_id)
        .limit(1)
        .execute()
    )
    business_rows = _row_dicts(business_result.data)

    if not business_rows:
        raise HTTPException(status_code=404, detail="Business profile not found")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=data.expires_in_days)

    invite_result = (
        supabase.table("invites")
        .insert(
            {
                "email": data.email.strip().lower(),
                "business_id": current_account.business_id,
                "role": data.role,
                "token": token,
                "expires_at": expires_at.isoformat(),
            }
        )
        .execute()
    )
    invite_rows = _row_dicts(invite_result.data)
    invite = invite_rows[0] if invite_rows else {}
    invite_id = str(invite.get("id", ""))

    return CreateInviteResponse(
        invite_id=invite_id,
        email=data.email.strip().lower(),
        business_id=str(current_account.business_id),
        role=data.role,
        token=token,
        registration_link=f"{settings.frontend_url.rstrip('/')}/register?invite={token}",
        expires_at=expires_at.isoformat(),
        warning=FRAMEWORK_WARNING,
    )

@router.get(
    "/scenario-configs",
    response_model=list[ScenarioConfigResponse],
)
async def get_scenario_configs(
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()

    result = (
        supabase.table("scenario_configs")
        .select("*")
        .eq("business_id", current_account.business_id)
        .execute()
    )

    rows = _row_dicts(result.data)

    return [
        ScenarioConfigResponse(
            business_id=str(row.get("business_id")),
            scenario_slug=str(row.get("scenario_slug")),
            title=row.get("title"),
            objective=row.get("objective"),
            persona_notes=row.get("persona_notes"),
        )
        for row in rows
    ]


@router.patch(
    "/scenario-configs/{scenario_slug}",
    response_model=ScenarioConfigResponse,
)
async def update_scenario_config(
    scenario_slug: str,
    data: UpdateScenarioConfigRequest,
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()

    update_data = {
        key: value
        for key, value in data.model_dump().items()
        if value is not None
    }

    payload = {
        "business_id": current_account.business_id,
        "scenario_slug": scenario_slug,
        **update_data,
    }

    result = (
        supabase.table("scenario_configs")
        .upsert(payload, on_conflict="business_id,scenario_slug")
        .execute()
    )

    rows = _row_dicts(result.data)

    if not rows:
        raise HTTPException(status_code=500, detail="Scenario config update failed")

    row = rows[0]

    return ScenarioConfigResponse(
        business_id=str(row.get("business_id")),
        scenario_slug=str(row.get("scenario_slug")),
        title=row.get("title"),
        objective=row.get("objective"),
        persona_notes=row.get("persona_notes"),
    )
