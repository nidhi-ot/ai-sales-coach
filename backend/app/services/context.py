import json
from typing import Any, cast

from app.models.agent import ScenarioSlug
from app.services.scenarios import (
    DEFAULT_BUSINESS_PROFILE,
    FRAMEWORK_DIMENSIONS,
    ScenarioConfig,
    get_scenario_config,
    normalize_framework,
)

DEFAULT_METRIC_SCORES: dict[str, int | float] = {
    "rapport": 5,
    "needs_discovery": 5,
    "objection_handling": 5,
    "closing": 5,
}


def assemble_call_context(
    *,
    rep_profile: dict[str, Any] | None,
    business_profile: dict[str, Any] | None,
    scenario: ScenarioSlug,
) -> dict[str, Any]:
    profile = rep_profile or {}
    business = business_profile or DEFAULT_BUSINESS_PROFILE
    scenario_config = get_scenario_config(scenario)
    framework = normalize_framework(cast(str | None, business.get("framework")))
    metric_scores = _coerce_metric_scores(profile.get("metric_scores"))
    weakest_dimension = profile.get("weakest_dimension") or _find_weakest_dimension(
        metric_scores
    )
    profile_version = int(profile.get("version") or 0)
    business_context = _merge_business_context(business)

    system_instruction = _build_system_instruction(
        business_name=cast(
            str, business.get("name") or DEFAULT_BUSINESS_PROFILE["name"]
        ),
        business_context=business_context,
        framework=framework,
        metric_scores=metric_scores,
        weakest_dimension=weakest_dimension,
        scenario_config=scenario_config,
    )

    return {
        "system_instruction": system_instruction,
        "profile_version": profile_version,
        "weakest_dimension": weakest_dimension,
        "framework": framework,
        "scenario": scenario_config,
        "metric_scores": metric_scores,
    }


def _coerce_metric_scores(value: Any) -> dict[str, int | float]:
    if not isinstance(value, dict) or not value:
        return DEFAULT_METRIC_SCORES.copy()

    scores: dict[str, int | float] = {}
    for key, score in value.items():
        if isinstance(score, int | float):
            scores[str(key)] = score

    return scores or DEFAULT_METRIC_SCORES.copy()


def _find_weakest_dimension(metric_scores: dict[str, int | float]) -> str:
    return min(metric_scores, key=lambda key: metric_scores[key])


def _merge_business_context(business_profile: dict[str, Any]) -> dict[str, Any]:
    context_data = business_profile.get("context_data")
    if not isinstance(context_data, dict):
        context_data = {}

    default_context = cast(dict[str, Any], DEFAULT_BUSINESS_PROFILE["context_data"])
    return {
        "service": context_data.get("service") or default_context["service"],
        "market": context_data.get("market") or default_context["market"],
        "value_props": context_data.get("value_props")
        or default_context["value_props"],
        "common_objections": (
            context_data.get("common_objections")
            or default_context["common_objections"]
        ),
    }


def _build_system_instruction(
    *,
    business_name: str,
    business_context: dict[str, Any],
    framework: str,
    metric_scores: dict[str, int | float],
    weakest_dimension: str,
    scenario_config: ScenarioConfig,
) -> str:
    framework_dimensions = ", ".join(FRAMEWORK_DIMENSIONS[framework])
    success_conditions = "\n".join(
        f"- {condition}" for condition in scenario_config.success_conditions
    )
    objections = "\n".join(
        f"- {objection}" for objection in scenario_config.likely_objections
    )
    value_props = "\n".join(f"- {value}" for value in business_context["value_props"])
    common_objections = "\n".join(
        f"- {objection}" for objection in business_context["common_objections"]
    )

    return f"""You are the AI customer in a sales training simulation for {business_name}.

Role and realism:
- Stay in character as the prospect or customer. Never mention that you are a grader, rubric,
model, or simulator.
- Speak like a realistic buyer in a live sales conversation. Keep turns concise enough for a
voice call.
- Match the rep's language. If the rep speaks Swedish, respond in Swedish; if they use English,
respond in English.
- Do not coach, score, summarize, or reveal hidden evaluation criteria during the call.
- Make the rep earn progress. Do not accept a meeting, next step, or contract too easily.

Business context:
- Service: {business_context["service"]}
- Market: {business_context["market"]}
- Value propositions:
{value_props}
- Common market objections:
{common_objections}

Scenario:
- Type: {scenario_config.title}
- Objective for the rep: {scenario_config.objective}
- Your customer context: {scenario_config.customer_context}
- Opening posture: {scenario_config.opening_posture}
- Resistance profile: {scenario_config.resistance_profile}
- Difficulty rule: {scenario_config.difficulty_notes}
- Likely objections you may use:
{objections}

Hidden framework lens:
- Evaluate the rep naturally through {framework}: {framework_dimensions}.
- Do not recite the framework. Instead, only reveal buyer information when the rep earns it with
relevant questions.

Rep growth target:
- Latest metric scores: {json.dumps(metric_scores, sort_keys=True)}
- Weakest area to pressure-test: {weakest_dimension}
- Create realistic moments where the rep can practice this weak area, while still keeping the
conversation fair.

Success conditions before you should agree:
{success_conditions}

Conversation guardrails:
- If the rep is vague, ask for clarity or push back.
- If the rep over-talks, become shorter and more skeptical.
- If the rep asks good discovery questions, provide concrete but not overly convenient details.
- End with a clear buyer response: accepted next step, contract agreement, rejection, or specific
unresolved concern.
"""
