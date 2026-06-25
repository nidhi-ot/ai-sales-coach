from typing import Any, cast

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.db.client import get_supabase, get_supabase_auth

router = APIRouter()

OPTIMAL_BUSINESS_ID = settings.business_id


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    phone_number: str
    password: str


class LoginRequest(BaseModel):
    identifier: str
    password: str


def first_row(data: Any) -> dict[str, Any] | None:
    if isinstance(data, list) and data and isinstance(data[0], dict):
        return cast(dict[str, Any], data[0])
    return None


@router.post("/register")
async def register(data: RegisterRequest) -> dict[str, Any]:
    supabase = get_supabase()

    auth_result = supabase.auth.admin.create_user(
        {
            "email": data.email,
            "password": data.password,
            "email_confirm": True,
        }
    )

    if not auth_result.user:
        raise HTTPException(status_code=400, detail="Unable to create user")

    account_result = (
        supabase.table("salesperson_accounts")
        .insert(
            {
                "id": auth_result.user.id,
                "full_name": data.full_name,
                "phone_number": data.phone_number,
                "business_id": OPTIMAL_BUSINESS_ID,
                "role": "rep",
            }
        )
        .execute()
    )

    account = first_row(account_result.data)

    return {
        "message": "Registration successful",
        "user_id": auth_result.user.id,
        "rep_id": auth_result.user.id,
        "business_id": OPTIMAL_BUSINESS_ID,
        "full_name": data.full_name,
        "phone_number": data.phone_number,
        "role": "rep",
        "account": account,
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
        .select("id, full_name, phone_number, business_id, role")
        .eq("id", auth_result.user.id)
        .limit(1)
        .execute()
    )

    account = first_row(account_result.data)

    if not account:
        raise HTTPException(status_code=404, detail="Salesperson account not found")

    return {
        "message": "Login successful",
        "user_id": auth_result.user.id,
        "rep_id": auth_result.user.id,
        "email": auth_result.user.email,
        "full_name": account["full_name"],
        "phone_number": account["phone_number"],
        "business_id": account["business_id"],
        "role": account["role"],
    }


@router.post("/logout")
async def logout() -> dict[str, str]:
    return {"message": "Logout successful"}
