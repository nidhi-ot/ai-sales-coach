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


class AdminMemberResponse(BaseModel):
    id: str
    full_name: str
    email: str | None = None
    phone_number: str
    employee_id: str | None = None
    role: Literal["rep", "manager", "admin"]
    is_active: bool
    created_at: str | None = None


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
    updated_rows = _row_dicts(updated_result.data)
    updated_business = updated_rows[0] if updated_rows else business_rows[0]

    return UpdateBusinessFrameworkResponse(
        business_id=str(current_account.business_id),
        framework=str(updated_business.get("framework", data.framework)),
        warning=FRAMEWORK_WARNING,
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
        raise HTTPException(status_code=403, detail="Cannot modify your own admin member record")

    update_payload: dict[str, Any] = {}
    if data.role is not None:
        update_payload["role"] = data.role
    if data.is_active is not None:
        update_payload["is_active"] = data.is_active

    updated_result = (
        supabase.table("salesperson_accounts").update(update_payload).eq("id", member_id).execute()
    )
    updated_rows = _row_dicts(updated_result.data)
    updated_member = updated_rows[0] if updated_rows else {**member, **update_payload}

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
