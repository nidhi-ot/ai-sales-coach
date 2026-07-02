from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.authz import current_rep_id, get_owned_session
from app.api.deps import get_current_user
from app.db.client import get_supabase
from app.services.scorecards import (
    create_scorecard_stub,
)

router = APIRouter()


class ScorecardStub(BaseModel):
    session_id: str
    rep_id: str | None = None
    business_id: str | None = None


class ShareRequest(BaseModel):
    shared_with_manager: bool


# Creates an empty scorecard entry
@router.post("/")
async def create_scorecard(data: ScorecardStub, current_user=Depends(get_current_user)):
    supabase = get_supabase()
    rep_id = current_rep_id(current_user)
    session = get_owned_session(supabase, session_id=data.session_id, rep_id=rep_id)

    return await create_scorecard_stub(
        session_id=data.session_id,
        rep_id=rep_id,
        business_id=str(session["business_id"]),
    )


# Retrieves the scorecard by scorecard id, while still accepting a session id
# for older callers that link directly from the history page.
@router.get("/{scorecard_id}")
async def get_scorecard(scorecard_id: str, current_user=Depends(get_current_user)):
    supabase = get_supabase()
    rep_id = current_rep_id(current_user)

    result = supabase.table("scorecards").select("*").eq("id", scorecard_id).execute()

    if not result.data:
        result = supabase.table("scorecards").select("*").eq("session_id", scorecard_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Scorecard not found")

    scorecard = result.data[0]

    if scorecard.get("rep_id") != rep_id:
        raise HTTPException(status_code=404, detail="Scorecard not found")

    return scorecard


@router.patch("/session/{session_id}/share")
async def update_share_setting(
    session_id: str,
    data: ShareRequest,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    rep_id = current_rep_id(current_user)
    get_owned_session(supabase, session_id=session_id, rep_id=rep_id)

    (
        supabase.table("scorecards")
        .update({"shared_with_manager": data.shared_with_manager})
        .eq("session_id", session_id)
        .eq("rep_id", rep_id)
        .execute()
    )

    return {
        "success": True,
        "shared_with_manager": data.shared_with_manager,
    }
