from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import ensure_rep_access, get_current_user
from app.db.client import get_supabase
from app.services.scorecards import (
    create_scorecard_stub,
)

router = APIRouter()


def _row_dicts(data: object) -> list[dict[str, object]]:
    if not isinstance(data, list):
        return []

    return [row for row in data if isinstance(row, dict)]


def _require_row_value(row: dict[str, object], field: str, entity: str) -> str:
    value = row.get(field)
    if value is None:
        raise HTTPException(
            status_code=500,
            detail=f"{entity} is missing {field}",
        )

    return str(value)


class ScorecardStub(BaseModel):
    session_id: str
    rep_id: str
    business_id: str


class ShareRequest(BaseModel):
    shared_with_manager: bool


# Creates an empty scorecard entry
@router.post("/")
async def create_scorecard(
    data: ScorecardStub,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    session_result = (
        supabase.table("sessions")
        .select("id, rep_id, business_id")
        .eq("id", data.session_id)
        .limit(1)
        .execute()
    )

    session_rows = _row_dicts(session_result.data)

    if not session_rows:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_rows[0]
    rep_id = _require_row_value(session, "rep_id", "Session")
    business_id = _require_row_value(session, "business_id", "Session")
    ensure_rep_access(str(current_user.id), rep_id)

    return await create_scorecard_stub(
        session_id=data.session_id,
        rep_id=rep_id,
        business_id=business_id,
    )


# Retrieves the scorecard by scorecard id, while still accepting a session id
# for older callers that link directly from the history page.
@router.get("/{scorecard_id}")
async def get_scorecard(
    scorecard_id: str,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()

    result = supabase.table("scorecards").select("*").eq("id", scorecard_id).limit(1).execute()
    scorecard_rows = _row_dicts(result.data)

    if not scorecard_rows:
        result = (
            supabase.table("scorecards")
            .select("*")
            .eq("session_id", scorecard_id)
            .limit(1)
            .execute()
        )
        scorecard_rows = _row_dicts(result.data)

    if not scorecard_rows:
        raise HTTPException(status_code=404, detail="Scorecard not found")

    scorecard = scorecard_rows[0]
    rep_id = _require_row_value(scorecard, "rep_id", "Scorecard")
    ensure_rep_access(str(current_user.id), rep_id)

    return scorecard


@router.patch("/session/{session_id}/share")
async def update_share_setting(
    session_id: str,
    data: ShareRequest,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    result = (
        supabase.table("scorecards")
        .select("rep_id")
        .eq("session_id", session_id)
        .limit(1)
        .execute()
    )
    scorecard_rows = _row_dicts(result.data)

    if not scorecard_rows:
        raise HTTPException(status_code=404, detail="Scorecard not found")

    rep_id = _require_row_value(scorecard_rows[0], "rep_id", "Scorecard")
    ensure_rep_access(str(current_user.id), rep_id)

    (
        supabase.table("scorecards")
        .update({"shared_with_manager": data.shared_with_manager})
        .eq("session_id", session_id)
        .execute()
    )

    return {
        "success": True,
        "shared_with_manager": data.shared_with_manager,
    }
