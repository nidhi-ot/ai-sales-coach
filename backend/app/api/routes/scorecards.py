from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db.client import get_supabase
from app.services.scorecards import (
    create_scorecard_stub,
)

router = APIRouter()


class ScorecardStub(BaseModel):
    session_id: str
    rep_id: str
    business_id: str


class ShareRequest(BaseModel):
    shared_with_manager: bool


# Creates an empty scorecard entry
@router.post("/")
async def create_scorecard(data: ScorecardStub):
    return await create_scorecard_stub(
        session_id=data.session_id, rep_id=data.rep_id, business_id=data.business_id
    )

# Retrieves the scorecard by scorecard id, while still accepting a session id
# for older callers that link directly from the history page.
@router.get("/{scorecard_id}")
async def get_scorecard(scorecard_id: str):
    supabase = get_supabase()

    result = supabase.table("scorecards").select("*").eq("id", scorecard_id).execute()

    if not result.data:
        result = supabase.table("scorecards").select("*").eq("session_id", scorecard_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Scorecard not found")

    return result.data[0]


@router.patch("/session/{session_id}/share")
async def update_share_setting(
    session_id: str,
    data: ShareRequest,
):
    supabase = get_supabase()

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
