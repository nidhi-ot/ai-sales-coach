from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db.client import get_supabase
from app.services.scorecards import create_scorecard_stub

router = APIRouter()


class ScorecardStub(BaseModel):
    session_id: str
    rep_id: str
    business_id: str


@router.post("/")
async def create_scorecard(data: ScorecardStub):
    return await create_scorecard_stub(
        session_id=data.session_id, rep_id=data.rep_id, business_id=data.business_id
    )


@router.get("/{session_id}")
async def get_scorecard(session_id: str):
    supabase = get_supabase()

    result = (
        supabase.table("scorecards").select("*").eq("session_id", session_id).execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Scorecard not found")

    return result.data[0]
