from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import (
    CurrentAccount,
    ensure_business_access,
    ensure_rep_access,
    get_current_account,
)
from app.db.client import get_business_profile, get_latest_profile
from app.models.agent import (
    BeforeCallContextRequest,
    BeforeCallContextResponse,
    ScenarioSummary,
)
from app.services.context import assemble_call_context
from app.services.scenarios import UnsupportedScenarioError

router = APIRouter()


# Endpoint to assemble context before a call based on rep, business profiles,
# and the scenario
@router.post("/before-call", response_model=BeforeCallContextResponse)
async def assemble_before_call_context(
    request: BeforeCallContextRequest,
    current_account: CurrentAccount = Depends(get_current_account),
) -> BeforeCallContextResponse:
    ensure_rep_access(current_account.id, str(request.rep_id))
    ensure_business_access(current_account.business_id, str(request.business_id))

    business_id = current_account.business_id
    rep_profile = await get_latest_profile(str(request.rep_id), business_id)
    business_profile = await get_business_profile(business_id)

    if business_profile is None:
        raise HTTPException(status_code=404, detail="Business profile not found")

    try:
        context = assemble_call_context(
            rep_profile=rep_profile,
            business_profile=business_profile,
            scenario=request.scenario,
        )
    except UnsupportedScenarioError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    scenario = context["scenario"]

    return BeforeCallContextResponse(
        rep_id=request.rep_id,
        business_id=request.business_id,
        scenario=ScenarioSummary(
            scenario=scenario.slug,
            title=scenario.title,
            objective=scenario.objective,
            success_conditions=list(scenario.success_conditions),
        ),
        profile_version=context["profile_version"],
        weakest_dimension=context["weakest_dimension"],
        framework=context["framework"],
        metric_scores=context["metric_scores"],
        system_instruction=context["system_instruction"],
    )
