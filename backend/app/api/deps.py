from fastapi import Header, HTTPException

from app.config import settings
from app.db.client import get_supabase


def get_settings():
    return settings


def ensure_rep_access(current_user_id: str, rep_id: str) -> None:
    if str(current_user_id) != str(rep_id):
        raise HTTPException(status_code=403, detail="Forbidden")


async def get_current_user(
    authorization: str | None = Header(default=None),
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
