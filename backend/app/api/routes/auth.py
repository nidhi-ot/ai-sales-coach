from datetime import datetime, timezone
from typing import Any, cast

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase_auth.errors import AuthApiError

from app.config import settings
from app.db.client import get_supabase, get_supabase_auth

router = APIRouter()

OPTIMAL_BUSINESS_ID = settings.business_id


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    phone_number: str
    password: str
    invite_token: str | None = None
    employee_id: str | None = None


class LoginRequest(BaseModel):
    identifier: str
    password: str


def first_row(data: Any) -> dict[str, Any] | None:
    if isinstance(data, list) and data and isinstance(data[0], dict):
        return cast(dict[str, Any], data[0])
    return None


def _get_business_language(supabase, business_id: str) -> str:
    result = (
        supabase.table("business_profiles")
        .select("language")
        .eq("id", business_id)
        .limit(1)
        .execute()
    )

    business = first_row(result.data)

    return str(business.get("language") or "en") if business else "en"


def _clean_optional_text(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()
    return cleaned or None


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _parse_datetime(value: Any) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        normalized = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None

    return None


def _invite_is_valid(invite: dict[str, Any]) -> bool:
    used_at = _parse_datetime(invite.get("used_at"))
    expires_at = _parse_datetime(invite.get("expires_at"))
    now = datetime.now(timezone.utc)

    if used_at is not None:
        return False

    if expires_at is None:
        return False

    return expires_at > now


def _consume_invite(
    supabase,
    invite_token: str,
    email: str,
) -> dict[str, Any]:
    invite_result = (
        supabase.table("invites").select("*").eq("token", invite_token).limit(1).execute()
    )
    invite = first_row(invite_result.data)

    if not invite or not _invite_is_valid(invite):
        raise HTTPException(status_code=403, detail="Invalid or expired invite")

    invite_email = _normalize_email(cast(str, invite.get("email", "")))
    if invite_email != _normalize_email(email):
        raise HTTPException(status_code=403, detail="Invite email does not match")

    consume_result = (
        supabase.table("invites")
        .update({"used_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", invite["id"])
        .is_("used_at", None)
        .execute()
    )
    consumed_invite = first_row(consume_result.data)

    if not consumed_invite:
        raise HTTPException(status_code=403, detail="Invalid or expired invite")

    return consumed_invite


def _release_invite(supabase, invite_id: str) -> None:
    supabase.table("invites").update({"used_at": None}).eq("id", invite_id).execute()


@router.post("/register")
async def register(data: RegisterRequest) -> dict[str, Any]:
    supabase = get_supabase()
    invite_token = _clean_optional_text(data.invite_token)
    employee_id = _clean_optional_text(data.employee_id)

    business_id = OPTIMAL_BUSINESS_ID
    role = "rep"

    invite: dict[str, Any] | None = None

    if invite_token:
        invite = _consume_invite(supabase, invite_token, data.email)
        business_id = str(invite["business_id"])
        role = str(invite["role"])
    elif not settings.allow_open_signup:
        raise HTTPException(
            status_code=403,
            detail="An invite token is required to create an account",
        )

    created_user_id: str | None = None
    try:
        auth_result = supabase.auth.admin.create_user(
            {
                "email": data.email,
                "password": data.password,
                "email_confirm": True,
            }
        )
    except AuthApiError as exc:
        if invite is not None:
            _release_invite(supabase, str(invite["id"]))
        status_code = 409 if "already been registered" in str(exc) else 400
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc

    if not auth_result.user:
        if invite is not None:
            _release_invite(supabase, str(invite["id"]))
        raise HTTPException(status_code=400, detail="Unable to create user")

    created_user_id = auth_result.user.id

    try:
        account_result = (
            supabase.table("salesperson_accounts")
            .insert(
                {
                    "id": auth_result.user.id,
                    "email": data.email,
                    "full_name": data.full_name,
                    "phone_number": data.phone_number,
                    "employee_id": employee_id,
                    "business_id": business_id,
                    "role": role,
                }
            )
            .execute()
        )
    except Exception as exc:
        if created_user_id:
            try:
                supabase.auth.admin.delete_user(created_user_id)
            except Exception:
                pass

        if invite is not None:
            _release_invite(supabase, str(invite["id"]))
        raise HTTPException(status_code=400, detail="Unable to create account") from exc

    account = first_row(account_result.data)
    business_language = _get_business_language(supabase, str(business_id))

    return {
        "message": "Registration successful",
        "user_id": auth_result.user.id,
        "rep_id": auth_result.user.id,
        "business_id": business_id,
        "full_name": data.full_name,
        "email": data.email,
        "phone_number": data.phone_number,
        "employee_id": employee_id,
        "role": role,
        "account": account,
        "business_language": business_language,
    }


@router.post("/login")
async def login(data: LoginRequest) -> dict[str, Any]:
    supabase = get_supabase()
    auth_supabase = get_supabase_auth()

    identifier = data.identifier.strip()

    if not identifier:
        raise HTTPException(status_code=400, detail="Email or phone is required")

    email = identifier

    if "@" not in identifier:
        phone_result = (
            supabase.table("salesperson_accounts")
            .select("id")
            .eq("phone_number", identifier)
            .limit(1)
            .execute()
        )

        phone_account = first_row(phone_result.data)

        if not phone_account:
            raise HTTPException(status_code=404, detail="Phone number not found")

        user_id = str(phone_account["id"])

        user_result = supabase.auth.admin.get_user_by_id(user_id)

        if not user_result.user or not user_result.user.email:
            raise HTTPException(status_code=404, detail="User email not found")

        email = user_result.user.email

    try:
        auth_result = auth_supabase.auth.sign_in_with_password(
            {
                "email": email,
                "password": data.password,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid login credentials",
        ) from exc

    if not auth_result.user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")

    account_result = (
        supabase.table("salesperson_accounts")
        .select("id, full_name, phone_number, employee_id, business_id, role")
        .eq("id", auth_result.user.id)
        .limit(1)
        .execute()
    )

    account = first_row(account_result.data)

    if not account:
        raise HTTPException(status_code=404, detail="Salesperson account not found")

    business_language = _get_business_language(supabase, str(account["business_id"]))

    return {
        "message": "Login successful",
        "user_id": auth_result.user.id,
        "access_token": auth_result.session.access_token if auth_result.session else None,
        "rep_id": auth_result.user.id,
        "email": auth_result.user.email,
        "full_name": account["full_name"],
        "phone_number": account["phone_number"],
        "employee_id": account["employee_id"],
        "business_id": account["business_id"],
        "role": account["role"],
        "business_language": business_language,
    }


@router.post("/logout")
async def logout() -> dict[str, str]:
    return {"message": "Logout successful"}
