from fastapi import APIRouter, HTTPException

from app.db.client import get_business_profile, get_latest_profile
from app.models.agent import (
    BeforeCallContextRequest,
    BeforeCallContextResponse,
    ScenarioSummary,
)
from app.services.context import assemble_call_context

router = APIRouter()

# Endpoint to assemble context before a call based on rep, business profiles, 
# and the scenario
@router.post("/before-call", response_model=BeforeCallContextResponse)
async def assemble_before_call_context(
    request: BeforeCallContextRequest,
) -> BeforeCallContextResponse:
    rep_profile = await get_latest_profile(str(request.rep_id))
    business_profile = await get_business_profile(str(request.business_id))

    if business_profile is None:
        raise HTTPException(status_code=404, detail="Business profile not found")

    context = assemble_call_context(
        rep_profile=rep_profile,
        business_profile=business_profile,
        scenario=request.scenario,
    )
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
