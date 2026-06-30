from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.db.client import get_supabase

router = APIRouter()


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


@router.get("/me/latest")
async def get_latest_salesperson_profile(
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()

    rep_id = current_user.id

    result = (
        supabase.table("salesperson_profiles")
        .select(
            "version, weakest_dimension, metric_scores, created_at"
        )
        .eq("rep_id", rep_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    rows = _row_dicts(result.data)

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No learning profile found",
        )

    return rows[0]