from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import ensure_rep_access, get_current_user
from app.db.client import get_supabase
from app.services.scorecards import (
    SCORECARD_STATUS_FAILED,
    SCORECARD_STATUS_PROCESSING,
    create_scorecard_stub,
    is_stub_scorecard,
    mark_scorecard_processing,
    run_scorecard_pipeline,
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
            .order("created_at", desc=True)
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


@router.post("/session/{session_id}/reprocess")
async def reprocess_scorecard(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    supabase = get_supabase()
    session_result = (
        supabase.table("sessions")
        .select("id, rep_id, business_id")
        .eq("id", session_id)
        .limit(1)
        .execute()
    )
    session_rows = _row_dicts(session_result.data)

    if not session_rows:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_rows[0]
    rep_id = _require_row_value(session, "rep_id", "Session")
    ensure_rep_access(str(current_user.id), rep_id)

    scorecard_result = (
        supabase.table("scorecards").select("*").eq("session_id", session_id).limit(1).execute()
    )
    scorecard_rows = _row_dicts(scorecard_result.data)

    if scorecard_rows:
        scorecard = scorecard_rows[0]
        status = scorecard.get("status")
        if status == SCORECARD_STATUS_PROCESSING:
            raise HTTPException(status_code=409, detail="Scorecard is already processing")

        if status != SCORECARD_STATUS_FAILED and not is_stub_scorecard(scorecard):
            raise HTTPException(status_code=409, detail="Scorecard is not failed or stubbed")

    transcript_result = (
        supabase.table("transcripts").select("id").eq("session_id", session_id).limit(1).execute()
    )
    if not _row_dicts(transcript_result.data):
        raise HTTPException(status_code=400, detail="No stored transcripts to reprocess")

    scorecard = await mark_scorecard_processing(session_id)
    background_tasks.add_task(run_scorecard_pipeline, session_id)

    return {
        "success": True,
        "score_card_status": "processing",
        "score_card": scorecard,
    }
