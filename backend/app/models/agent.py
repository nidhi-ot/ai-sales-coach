from enum import Enum

from pydantic import BaseModel, Field


class ScenarioSlug(str, Enum):
    cold_call = "cold_call"
    hot_call = "hot_call"
    directsales = "directsales"
    meeting = "meeting"


class BeforeCallContextRequest(BaseModel):
    rep_id: str | None = None
    business_id: str | None = None
    scenario: ScenarioSlug


class ScenarioSummary(BaseModel):
    scenario: ScenarioSlug
    title: str
    objective: str
    success_conditions: list[str] = Field(default_factory=list)


class BeforeCallContextResponse(BaseModel):
    rep_id: str
    business_id: str
    scenario: ScenarioSummary
    profile_version: int
    weakest_dimension: str | None = None
    framework: str
    metric_scores: dict[str, int | float] = Field(default_factory=dict)
    system_instruction: str
