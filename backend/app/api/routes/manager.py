from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import CurrentAccount, ensure_business_access, require_role
from app.db.client import get_supabase

router = APIRouter()


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


def _first_row(data: Any) -> dict[str, Any] | None:
    rows = _row_dicts(data)
    return rows[0] if rows else None


def _ensure_rep_in_business(rep_id: str, business_id: str) -> None:
    rep = _first_row(
        get_supabase()
        .table("salesperson_accounts")
        .select("id")
        .eq("id", rep_id)
        .eq("business_id", business_id)
        .limit(1)
        .execute()
        .data
    )

    if not rep:
        raise HTTPException(
            status_code=403,
            detail="Rep is not in your business",
        )


class ManagerBusinessOverviewResponse(BaseModel):
    business: dict[str, Any]
    reps: list[dict[str, Any]]
    rep_count: int


@router.get(
    "/business/{business_id}/team",
    response_model=ManagerBusinessOverviewResponse,
)
async def get_business_team_overview(
    business_id: str,
    current_account: CurrentAccount = Depends(require_role("manager")),
):
    if current_account.role != "admin":
        ensure_business_access(current_account.business_id, business_id)

    supabase = get_supabase()

    business_result = (
        supabase.table("business_profiles").select("*").eq("id", business_id).limit(1).execute()
    )
    business_rows = _row_dicts(business_result.data)

    if not business_rows:
        raise HTTPException(status_code=404, detail="Business profile not found")

    team_result = (
        supabase.table("salesperson_accounts")
        .select("id, full_name, phone_number, business_id, role")
        .eq("business_id", business_id)
        .eq("role", "rep")
        .execute()
    )
    reps = _row_dicts(team_result.data)

    team_with_stats = []

    for rep in reps:
        rep_id = rep["id"]

        sessions = _row_dicts(
            supabase.table("sessions")
            .select("id, started_at")
            .eq("rep_id", rep_id)
            .order("started_at", desc=True)
            .execute()
            .data
        )

        session_count = len(sessions)
        last_practice = sessions[0]["started_at"] if sessions else None

        scorecards = _row_dicts(
            supabase.table("scorecards")
            .select(
                "rapport_score, needs_discovery_score, " "objection_handling_score, closing_score"
            )
            .eq("rep_id", rep_id)
            .execute()
            .data
        )

        average_score = None
        weakest_dimension = None

        if scorecards:
            dimensions: dict[str, list[float]] = {
                "Rapport": [],
                "Discovery": [],
                "Objection Handling": [],
                "Closing": [],
            }

            overall_scores = []

            for scorecard in scorecards:
                values = [
                    scorecard.get("rapport_score"),
                    scorecard.get("needs_discovery_score"),
                    scorecard.get("objection_handling_score"),
                    scorecard.get("closing_score"),
                ]

                valid = [float(v) for v in values if v is not None]

                if valid:
                    overall_scores.extend(valid)

                if scorecard.get("rapport_score") is not None:
                    dimensions["Rapport"].append(float(scorecard["rapport_score"]))

                if scorecard.get("needs_discovery_score") is not None:
                    dimensions["Discovery"].append(float(scorecard["needs_discovery_score"]))

                if scorecard.get("objection_handling_score") is not None:
                    dimensions["Objection Handling"].append(
                        float(scorecard["objection_handling_score"])
                    )

                if scorecard.get("closing_score") is not None:
                    dimensions["Closing"].append(float(scorecard["closing_score"]))

            if overall_scores:
                average_score = round(sum(overall_scores) / len(overall_scores), 1)

            averages = {
                key: sum(values) / len(values) for key, values in dimensions.items() if values
            }

            if averages:
                weakest_dimension = min(averages, key=lambda key: averages[key])

        team_with_stats.append(
            {
                "id": rep["id"],
                "full_name": rep.get("full_name"),
                "phone_number": rep.get("phone_number"),
                "business_id": rep.get("business_id"),
                "role": rep.get("role"),
                "sessions": session_count,
                "last_practice": last_practice,
                "average_score": average_score,
                "weakest_dimension": weakest_dimension,
            }
        )

    return {
        "business": business_rows[0],
        "reps": team_with_stats,
        "rep_count": len(team_with_stats),
    }


@router.get("/reps/{rep_id}/sessions")
async def get_manager_rep_sessions(
    rep_id: str,
    current_account: CurrentAccount = Depends(require_role("manager")),
):
    _ensure_rep_in_business(rep_id, current_account.business_id)

    sessions = _row_dicts(
        get_supabase()
        .table("sessions")
        .select("id, scenario, started_at, ended_at, duration_seconds, status")
        .eq("rep_id", rep_id)
        .order("started_at", desc=True)
        .execute()
        .data
    )

    return {"sessions": sessions}


@router.get("/reps/{rep_id}/scorecards")
async def get_manager_rep_scorecards(
    rep_id: str,
    current_account: CurrentAccount = Depends(require_role("manager")),
):
    _ensure_rep_in_business(rep_id, current_account.business_id)

    scorecards = _row_dicts(
        get_supabase()
        .table("scorecards")
        .select("*")
        .eq("rep_id", rep_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )

    return {"scorecards": scorecards}


@router.get("/reps/{rep_id}/transcripts")
async def get_manager_rep_transcripts(
    rep_id: str,
    current_account: CurrentAccount = Depends(require_role("manager")),
):
    _ensure_rep_in_business(rep_id, current_account.business_id)

    sessions = _row_dicts(
        get_supabase().table("sessions").select("id").eq("rep_id", rep_id).execute().data
    )

    session_ids = [row["id"] for row in sessions if row.get("id")]

    if not session_ids:
        return {"transcripts": []}

    transcripts = _row_dicts(
        get_supabase()
        .table("transcripts")
        .select("*")
        .in_("session_id", session_ids)
        .order("timestamp_offset_ms")
        .execute()
        .data
    )

    return {"transcripts": transcripts}


@router.get("/business/{business_id}/progress")
async def get_manager_team_progress(
    business_id: str,
    current_account: CurrentAccount = Depends(require_role("manager")),
):
    if current_account.role != "admin":
        ensure_business_access(current_account.business_id, business_id)

    supabase = get_supabase()

    reps = _row_dicts(
        supabase.table("salesperson_accounts")
        .select("id")
        .eq("business_id", business_id)
        .eq("role", "rep")
        .execute()
        .data
    )

    rep_ids = [row["id"] for row in reps if row.get("id")]

    if not rep_ids:
        return {"progress": {}}

    scorecards = _row_dicts(
        supabase.table("scorecards")
        .select(
            "rapport_score," "needs_discovery_score," "objection_handling_score," "closing_score"
        )
        .in_("rep_id", rep_ids)
        .execute()
        .data
    )

    fields = {
        "rapport": "rapport_score",
        "discovery": "needs_discovery_score",
        "objection_handling": "objection_handling_score",
        "closing": "closing_score",
    }

    progress: dict[str, dict[str, float | int | None]] = {}

    for key, field in fields.items():
        values = [float(row[field]) for row in scorecards if row.get(field) is not None]

        progress[key] = {
            "average": round(sum(values) / len(values), 2) if values else None,
            "count": len(values),
        }

    return {"progress": progress}


@router.get("/business/{business_id}/reps/{rep_id}/sessions")
async def get_manager_business_rep_sessions(
    business_id: str,
    rep_id: str,
    current_account: CurrentAccount = Depends(require_role("manager")),
):
    if current_account.role != "admin":
        ensure_business_access(current_account.business_id, business_id)

    _ensure_rep_in_business(rep_id, business_id)

    sessions = _row_dicts(
        get_supabase()
        .table("sessions")
        .select("id, scenario, started_at, ended_at, duration_seconds, status")
        .eq("rep_id", rep_id)
        .order("started_at", desc=True)
        .execute()
        .data
    )

    return {"sessions": sessions}


@router.get("/business/{business_id}/reps/{rep_id}/scorecards")
async def get_manager_business_rep_scorecards(
    business_id: str,
    rep_id: str,
    current_account: CurrentAccount = Depends(require_role("manager")),
):
    if current_account.role != "admin":
        ensure_business_access(current_account.business_id, business_id)

    _ensure_rep_in_business(rep_id, business_id)

    scorecards = _row_dicts(
        get_supabase()
        .table("scorecards")
        .select("*")
        .eq("rep_id", rep_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )

    return {"scorecards": scorecards}


@router.get("/business/{business_id}/reps/{rep_id}/transcripts")
async def get_manager_business_rep_transcripts(
    business_id: str,
    rep_id: str,
    current_account: CurrentAccount = Depends(require_role("manager")),
):
    if current_account.role != "admin":
        ensure_business_access(current_account.business_id, business_id)

    _ensure_rep_in_business(rep_id, business_id)

    sessions = _row_dicts(
        get_supabase().table("sessions").select("id").eq("rep_id", rep_id).execute().data
    )

    session_ids = [row["id"] for row in sessions if row.get("id")]

    if not session_ids:
        return {"transcripts": []}

    transcripts = _row_dicts(
        get_supabase()
        .table("transcripts")
        .select("*")
        .in_("session_id", session_ids)
        .order("timestamp_offset_ms")
        .execute()
        .data
    )

    return {"transcripts": transcripts}
