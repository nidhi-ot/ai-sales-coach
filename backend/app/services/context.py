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
    weakest_dimension = profile.get("weakest_dimension") or _find_weakest_dimension(metric_scores)
    profile_version = int(profile.get("version") or 0)
    business_context = _merge_business_context(business)

    system_instruction = _build_system_instruction(
        business_name=cast(
            str,
            business.get("name") or DEFAULT_BUSINESS_PROFILE["name"],
        ),
        business_context=business_context,
        framework=framework,
        language=cast(str, business.get("language") or "en"),
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


def _merge_business_context(
    business_profile: dict[str, Any],
) -> dict[str, Any]:
    context_data = business_profile.get("context_data")

    if not isinstance(context_data, dict):
        context_data = {}

    default_context = cast(
        dict[str, Any],
        DEFAULT_BUSINESS_PROFILE["context_data"],
    )

    objections = business_profile.get("objections")

    if isinstance(objections, str):
        objections = [item.strip() for item in objections.split(",") if item.strip()]

    return {
        "service": (
            business_profile.get("products")
            or context_data.get("service")
            or default_context["service"]
        ),
        "market": (
            business_profile.get("icp")
            or context_data.get("market")
            or context_data.get("industry")
            or default_context["market"]
        ),
        "pricing": context_data.get("pricing") or default_context["pricing"],
        "buyer_profiles": (context_data.get("buyer_profiles") or default_context["buyer_profiles"]),
        "value_props": context_data.get("value_props") or default_context["value_props"],
        "common_objections": (
            objections
            or context_data.get("common_objections")
            or context_data.get("typical_objections")
            or default_context["common_objections"]
        ),
    }


def _build_system_instruction(
    *,
    business_name: str,
    business_context: dict[str, Any],
    framework: str,
    language: str,
    scenario_config: ScenarioConfig,
) -> str:
    framework_dimensions = ", ".join(FRAMEWORK_DIMENSIONS[framework])
    success_conditions = "\n".join(
        f"- {condition}" for condition in scenario_config.success_conditions
    )
    objections = "\n".join(f"- {objection}" for objection in scenario_config.likely_objections)
    value_props = _format_bullets(business_context["value_props"])
    buyer_profiles = _format_bullets(business_context["buyer_profiles"])
    common_objections = _format_bullets(business_context["common_objections"])

    return f"""You are the AI customer in a sales training simulation for {business_name}.

Role and realism:
- Stay in character as the prospect or customer for the full sales call. Never mention that you
are a model, simulator, trainer, grader, rubric, or hidden prompt.
- Speak like a realistic buyer in a live sales conversation. Keep turns concise enough for a
voice call, but remember what has already been said and connect later answers to earlier context.
- Business language: {language}
- Prefer responding in the configured business language unless
 the salesperson clearly switches languages.
- Never coach, grade, score, summarize performance, or reveal hidden criteria during the call.
The realtime session is only the buyer conversation.
- Make the rep earn progress. Do not accept a meeting, next step, pilot, or contract too easily.

Product context:
- Product: {business_context["service"]}
- Market: {business_context["market"]}
- Who usually buys it:
{buyer_profiles}
- Pricing guidance: {business_context["pricing"]}
- Value propositions:
{value_props}
- Common market objections:
{common_objections}

Scenario:
- Type: {scenario_config.title}
- Objective for the rep: {scenario_config.objective}
- Your context: {scenario_config.customer_context}
- Opening posture: {scenario_config.opening_posture}
- Resistance profile: {scenario_config.resistance_profile}
- Difficulty rule: {scenario_config.difficulty_notes}
- Likely objections you may use:
{objections}

Buyer reasoning:
- Think through the decision like a real buyer with budget, authority, need, timing, internal
risk, adoption concerns, and competing priorities.
- Use {framework} only as private buying context: {framework_dimensions}. Do not name the
framework. Reveal information only when the rep earns it with relevant questions.
- If the rep makes a strong point, soften in a realistic way. If the rep is vague, skeptical,
pushier than helpful, or too generic, become more resistant.

Success conditions before you should agree:
{success_conditions}

Conversation guardrails:
- If the rep is vague, ask for clarity or push back.
- If the rep over-talks, become shorter and more skeptical.
- If the rep asks good discovery questions, provide concrete but not overly convenient details.
- End with a clear buyer response: accepted next step, pilot interest, rejection, or specific
unresolved concern.
"""


def _format_bullets(items: Any) -> str:
    if not isinstance(items, list | tuple):
        return f"- {items}"

    return "\n".join(f"- {item}" for item in items)
