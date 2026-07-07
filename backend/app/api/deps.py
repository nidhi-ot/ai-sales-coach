from collections.abc import Callable, Coroutine
from typing import Any

from fastapi import Depends, Header, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.db.client import get_supabase


def get_settings():
    return settings


def ensure_rep_access(current_user_id: str, rep_id: str) -> None:
    if str(current_user_id) != str(rep_id):
        raise HTTPException(status_code=403, detail="Forbidden")


def ensure_business_access(current_business_id: str, target_business_id: str) -> None:
    if str(current_business_id) != str(target_business_id):
        raise HTTPException(status_code=403, detail="Forbidden")


class CurrentAccount(BaseModel):
    id: str
    role: str
    business_id: str


def _first_row(data: Any) -> dict[str, Any] | None:
    if isinstance(data, list) and data and isinstance(data[0], dict):
        return data[0]
    return None


async def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header",
        )

    token = authorization.removeprefix("Bearer ").strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing auth token",
        )

    supabase = get_supabase()

    try:
        auth_response = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid auth token",
        ) from exc

    user = getattr(auth_response, "user", None)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid auth token",
        )

    return user


async def get_current_account(
    current_user=Depends(get_current_user),
) -> CurrentAccount:
    supabase = get_supabase()

    result = (
        supabase.table("salesperson_accounts")
        .select("id, role, business_id, is_active")
        .eq("id", current_user.id)
        .limit(1)
        .execute()
    )

    account = _first_row(result.data)

    if account is None:
        raise HTTPException(status_code=403, detail="Account not found")

    business_id = account.get("business_id")

    if not business_id:
        raise HTTPException(status_code=403, detail="Account business not found")

    role = str(account.get("role") or "").strip().lower()

    if not role:
        raise HTTPException(status_code=403, detail="Account role not found")

    if account.get("is_active") is False:
        raise HTTPException(status_code=403, detail="Account is inactive")

    return CurrentAccount(
        id=str(account["id"]),
        role=role,
        business_id=str(business_id),
    )


def require_role(required_role: str) -> Callable[..., Coroutine[Any, Any, CurrentAccount]]:
    normalized_required_role = str(required_role).strip().lower()

    async def _dependency(
        current_account: CurrentAccount = Depends(get_current_account),
    ) -> CurrentAccount:
        if current_account.role == "admin":
            return current_account

        if current_account.role != normalized_required_role:
            raise HTTPException(status_code=403, detail="Forbidden")

        return current_account

    return _dependency
