from typing import Any

from fastapi import HTTPException


def current_rep_id(current_user: Any) -> str:
    rep_id = getattr(current_user, "id", None)

    if not rep_id:
        raise HTTPException(status_code=401, detail="Invalid auth token")

    return str(rep_id)


def require_same_rep_id(requested_rep_id: str, current_user: Any) -> str:
    rep_id = current_rep_id(current_user)

    if requested_rep_id != rep_id:
        raise HTTPException(status_code=403, detail="Cannot access another rep's data")

    return rep_id


def row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


def get_owned_session(supabase: Any, session_id: str, rep_id: str) -> dict[str, Any]:
    result = (
        supabase.table("sessions")
        .select("*")
        .eq("id", session_id)
        .eq("rep_id", rep_id)
        .limit(1)
        .execute()
    )

    rows = row_dicts(result.data)

    if not rows:
        raise HTTPException(status_code=404, detail="Session not found")

    return rows[0]
