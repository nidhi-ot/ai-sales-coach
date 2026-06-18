from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db.client import get_supabase

router = APIRouter()

OPTIMAL_BUSINESS_ID = "8f42fcd8-b75c-47c1-9d15-0b57fc193b7d"


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    phone_number: str
    password: str


class LoginRequest(BaseModel):
    identifier: str
    password: str


@router.post("/register")
async def register(data: RegisterRequest):
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

    return {
        "message": "Registration successful",
        "user_id": auth_result.user.id,
        "rep_id": auth_result.user.id,
        "business_id": OPTIMAL_BUSINESS_ID,
        "full_name": data.full_name,
        "phone_number": data.phone_number,
        "role": "rep",
        "account": account_result.data[0] if account_result.data else None,
    }


@router.post("/login")
async def login(data: LoginRequest):
    supabase = get_supabase()

    identifier = data.identifier.strip()

    if not identifier:
        raise HTTPException(status_code=400, detail="Email or phone is required")

    email = identifier

    if "@" not in identifier:
        account_result = (
            supabase.table("salesperson_accounts")
            .select("id")
            .eq("phone_number", identifier)
            .limit(1)
            .execute()
        )

        if not account_result.data:
            raise HTTPException(status_code=404, detail="Phone number not found")

        user_id = account_result.data[0]["id"]
        user_result = supabase.auth.admin.get_user_by_id(user_id)

        if not user_result.user or not user_result.user.email:
            raise HTTPException(status_code=404, detail="User email not found")

        email = user_result.user.email

    try:
        auth_result = supabase.auth.sign_in_with_password(
            {
                "email": email,
                "password": data.password,
            }
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid login credentials")

    if not auth_result.user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")

    account_result = (
        supabase.table("salesperson_accounts")
        .select("id, full_name, phone_number, business_id, role")
        .eq("id", auth_result.user.id)
        .limit(1)
        .execute()
    )

    if not account_result.data:
        raise HTTPException(status_code=404, detail="Salesperson account not found")

    account = account_result.data[0]

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
