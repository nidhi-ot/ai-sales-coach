import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, cast

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


class AdminMemberResponse(BaseModel):
    id: str
    full_name: str
    email: str | None = None
    phone_number: str
    employee_id: str | None = None
    role: Literal["rep", "manager", "admin"]
    is_active: bool
    created_at: str | None = None


class AdminMemberExportResponse(BaseModel):
    account: dict[str, Any]
    sessions: list[dict[str, Any]]
    transcripts: list[dict[str, Any]]
    scorecards: list[dict[str, Any]]
    profile_versions: list[dict[str, Any]]


class UpdateAdminMemberRequest(BaseModel):
    role: Literal["rep", "manager", "admin"] | None = None
    is_active: bool | None = None


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

    updated_error = getattr(updated_result, "error", None)
    if updated_error:
        raise HTTPException(status_code=500, detail=str(updated_error))

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

    update_data = {key: value for key, value in data.model_dump().items() if value is not None}
    updated_result = (
        supabase.table("business_profiles")
        .update(update_data)
        .eq("id", current_account.business_id)
        .execute()
    )

    updated_rows = _row_dicts(updated_result.data)

    if not updated_rows:
        raise HTTPException(
            status_code=500,
            detail="Failed to update business profile",
        )

    updated_business = updated_rows[0]
    return BusinessProfileResponse(
        business_id=str(updated_business.get("id")),
        name=updated_business.get("name"),
        products=updated_business.get("products"),
        icp=updated_business.get("icp"),
        objections=updated_business.get("objections"),
        language=updated_business.get("language"),
        framework=updated_business.get("framework"),
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

    update_data = {key: value for key, value in data.model_dump().items() if value is not None}

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


@router.get("/members", response_model=list[AdminMemberResponse])
async def list_members(
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()

    result = (
        supabase.table("salesperson_accounts")
        .select("id, full_name, email, phone_number, employee_id, role, is_active, created_at")
        .eq("business_id", current_account.business_id)
        .order("created_at", desc=True)
        .execute()
    )

    return _row_dicts(result.data)


@router.patch("/members/{member_id}", response_model=AdminMemberResponse)
async def update_member(
    member_id: str,
    data: UpdateAdminMemberRequest,
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    if data.role is None and data.is_active is None:
        raise HTTPException(status_code=400, detail="No member fields provided")

    supabase = get_supabase()

    member_result = (
        supabase.table("salesperson_accounts")
        .select(
            "id, full_name, email, phone_number, employee_id, role, "
            "is_active, business_id, created_at"
        )
        .eq("id", member_id)
        .limit(1)
        .execute()
    )
    member_rows = _row_dicts(member_result.data)

    if not member_rows:
        raise HTTPException(status_code=404, detail="Member not found")

    member = member_rows[0]

    if str(member.get("business_id")) != str(current_account.business_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    if str(member.get("id")) == str(current_account.id):
        raise HTTPException(
            status_code=403,
            detail="Cannot modify your own admin member record",
        )

    try:
        rpc_result = supabase.rpc(
            "update_admin_member",
            {
                "p_member_id": member_id,
                "p_business_id": current_account.business_id,
                "p_role": data.role,
                "p_is_active": data.is_active,
            },
        ).execute()
    except Exception as exc:  # noqa: BLE001
        message = str(exc)
        if "Cannot remove the last active admin" in message:
            raise HTTPException(
                status_code=403,
                detail="Cannot remove the last active admin from the business",
            ) from exc
        if "Member not found" in message:
            raise HTTPException(status_code=404, detail="Member not found") from exc
        raise

    updated_rows = _row_dicts(rpc_result.data)
    if not updated_rows:
        raise HTTPException(status_code=404, detail="Member not found")
    updated_member = updated_rows[0]

    return AdminMemberResponse(
        id=str(updated_member["id"]),
        full_name=str(updated_member["full_name"]),
        email=updated_member.get("email"),
        phone_number=str(updated_member["phone_number"]),
        employee_id=updated_member.get("employee_id"),
        role=cast(Literal["rep", "manager", "admin"], str(updated_member["role"])),
        is_active=bool(updated_member.get("is_active", True)),
        created_at=updated_member.get("created_at"),
    )


@router.get("/members/{member_id}/export", response_model=AdminMemberExportResponse)
async def export_member(
    member_id: str,
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()

    member_result = (
        supabase.table("salesperson_accounts")
        .select(
            "id, full_name, email, phone_number, employee_id, role, "
            "is_active, business_id, created_at, updated_at"
        )
        .eq("id", member_id)
        .limit(1)
        .execute()
    )
    member_rows = _row_dicts(member_result.data)
    if not member_rows:
        raise HTTPException(status_code=404, detail="Member not found")

    account = member_rows[0]
    if str(account.get("business_id")) != str(current_account.business_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    sessions_result = (
        supabase.table("sessions")
        .select("*")
        .eq("rep_id", member_id)
        .eq("business_id", current_account.business_id)
        .order("started_at", desc=True)
        .execute()
    )
    sessions = _row_dicts(sessions_result.data)
    session_ids = [str(session["id"]) for session in sessions if session.get("id") is not None]

    transcripts: list[dict[str, Any]] = []
    scorecards: list[dict[str, Any]] = []
    if session_ids:
        transcripts_result = (
            supabase.table("transcripts")
            .select("*")
            .in_("session_id", session_ids)
            .order("created_at", desc=True)
            .execute()
        )
        transcripts = _row_dicts(transcripts_result.data)

        scorecards_result = (
            supabase.table("scorecards")
            .select("*")
            .in_("session_id", session_ids)
            .order("created_at", desc=True)
            .execute()
        )
        scorecards = _row_dicts(scorecards_result.data)

    profile_versions_result = (
        supabase.table("salesperson_profiles")
        .select("*")
        .eq("rep_id", member_id)
        .eq("business_id", current_account.business_id)
        .order("version", desc=True)
        .execute()
    )
    profile_versions = _row_dicts(profile_versions_result.data)

    return AdminMemberExportResponse(
        account=account,
        sessions=sessions,
        transcripts=transcripts,
        scorecards=scorecards,
        profile_versions=profile_versions,
    )


@router.delete("/members/{member_id}")
async def delete_member(
    member_id: str,
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()

    member_result = (
        supabase.table("salesperson_accounts")
        .select("id, business_id")
        .eq("id", member_id)
        .limit(1)
        .execute()
    )
    member_rows = _row_dicts(member_result.data)
    if not member_rows:
        raise HTTPException(status_code=404, detail="Member not found")

    member = member_rows[0]
    if str(member.get("business_id")) != str(current_account.business_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        supabase.auth.admin.delete_user(member_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="Unable to delete auth user") from exc

    try:
        supabase.rpc(
            "delete_member_data",
            {
                "p_member_id": member_id,
                "p_business_id": current_account.business_id,
            },
        ).execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="Unable to delete member data") from exc

    return {"message": "Member deleted"}
