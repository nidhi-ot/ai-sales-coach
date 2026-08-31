from typing import Any, cast

from app.models.agent import ScenarioSlug
from app.services.scenarios import (
    DEFAULT_BUSINESS_PROFILE,
    FRAMEWORK_DIMENSIONS,
    ScenarioConfig,
    get_business_scenario_config,
    get_persona_variation_instruction,
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
    recent_learning_history: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    profile = rep_profile or {}
    business = business_profile or DEFAULT_BUSINESS_PROFILE
    business_id = business.get("id")

    scenario_config = get_business_scenario_config(
        scenario=scenario,
        business_id=str(business_id) if business_id else None,
    )

    framework = normalize_framework(cast(str | None, business.get("framework")))
    metric_scores = _coerce_metric_scores(profile.get("metric_scores"))
    weakest_dimension = profile.get("weakest_dimension") or _find_weakest_dimension(metric_scores)
    profile_version = int(profile.get("version") or 0)
    business_context = _merge_business_context(business)
    business_language = cast(str, business.get("language") or "en")

    system_instruction = _build_system_instruction(
        business_name=cast(
            str,
            business.get("name") or DEFAULT_BUSINESS_PROFILE["name"],
        ),
        business_context=business_context,
        framework=framework,
        language=business_language,
        scenario_config=scenario_config,
        recent_learning_history=recent_learning_history,
    )

    return {
        "system_instruction": system_instruction,
        "profile_version": profile_version,
        "weakest_dimension": weakest_dimension,
        "framework": framework,
        "language": business_language,
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


def _language_instruction(language: str) -> str:
    normalized_language = (language or "en").strip().lower().replace("_", "-")

    if normalized_language.startswith("sv"):
        return (
            "Language behavior:\n"
            "- Respond only in natural spoken Swedish for the entire call.\n"
            "- Do not switch to English, even if the salesperson uses English "
            "words, code-switches, or has an accent.\n"
            "- Keep the same persona, objections, buying context, and scenario "
            "behavior, but express everything in Swedish.\n"
            "- Use realistic Swedish business conversation language, not literal "
            "translation or formal written Swedish."
        )

    return "Language behavior:\n" "- Respond in natural spoken English for the entire call."


def _build_system_instruction(
    *,
    business_name: str,
    business_context: dict[str, Any],
    framework: str,
    language: str,
    scenario_config: ScenarioConfig,
    recent_learning_history: list[dict[str, Any]] | None = None,
) -> str:
    framework_dimensions = ", ".join(FRAMEWORK_DIMENSIONS[framework])
    success_conditions = "\n".join(
        f"- {condition}" for condition in scenario_config.success_conditions
    )
    objections = "\n".join(f"- {objection}" for objection in scenario_config.likely_objections)
    value_props = _format_bullets(business_context["value_props"])
    buyer_profiles = _format_bullets(business_context["buyer_profiles"])
    common_objections = _format_bullets(business_context["common_objections"])
    language_instruction = _language_instruction(language)
    recent_call_context = _recent_call_context_instruction(recent_learning_history)
    persona_variation = get_persona_variation_instruction(
        scenario_config.slug,
        recent_learning_history,
    )

    return f"""You are the AI customer in a sales training simulation for {business_name}.

Role and realism:
- Stay in character as the prospect or customer for the full sales call. Never mention that you
are a model, simulator, trainer, grader, rubric, or hidden prompt.
- Speak like a realistic buyer in a live sales conversation. Keep turns concise enough for a
voice call, but remember what has already been said and connect later answers to earlier context.
{language_instruction}

Tone example:
- Use this only as a style anchor. Do not copy it word for word.
- Customer: "Hallå, det är kunden."
- Salesperson: "Hej, jag ringer från..."
- Customer: "Okej, kort bara. Vad gäller det?"
- Salesperson: "Vi hjälper företag med..."
- Customer: "Jag förstår. Vi har redan en lösning för det, så vad skulle vara annorlunda?"

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
{persona_variation}
{recent_call_context}

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
- Keep normal customer replies to 1-2 sentences per turn.
- Raise only one objection at a time.
- Do not stack multiple objections in the same reply.
- Do not raise an objection until the salesperson has explained why they are calling
  or has started pitching.
- If the rep is vague, ask for clarity or push back.
- If the rep over-talks, become shorter and more skeptical.
- If the rep asks good discovery questions, provide concrete but not overly convenient details.
- End with a clear buyer response: accepted next step, pilot interest, rejection, or specific
unresolved concern.
"""


def _recent_call_context_instruction(history: list[dict[str, Any]] | None) -> str:
    if not history:
        return ""

    call_sections = []

    for index, call in enumerate(history[:3], start=1):
        raw_scorecard = call.get("scorecard")
        scorecard: dict[Any, Any] = raw_scorecard if isinstance(raw_scorecard, dict) else {}
        raw_transcript = call.get("transcript")
        transcript: list[Any] = raw_transcript if isinstance(raw_transcript, list) else []

        scores = []
        for label, field in (
            ("overall", "overall_score"),
            ("rapport", "rapport_score"),
            ("discovery", "needs_discovery_score"),
            ("objection_handling", "objection_handling_score"),
            ("closing", "closing_score"),
        ):
            score = scorecard.get(field)
            if score is not None:
                scores.append(f"{label}={score}")

        turns = []
        for turn in transcript[:8]:
            if not isinstance(turn, dict):
                continue

            text = " ".join(str(turn.get("text") or "").split())
            if not text:
                continue

            speaker = str(turn.get("speaker") or "unknown")
            turns.append(f"- {speaker}: {text[:240]}")

        call_sections.append(
            "\n".join(
                [
                    f"Call {index}: {call.get('scenario') or 'unknown'}",
                    f"Scores: {', '.join(scores) if scores else 'no scorecard available'}",
                    "Transcript excerpt:",
                    "\n".join(turns) if turns else "- No transcript excerpt available.",
                ]
            )
        )

    return (
        "Recent practice history:\n"
        "- Use these recent calls privately to avoid making practice feel repetitive.\n"
        "- Do not quote or reveal this history directly to the salesperson.\n"
        "- Vary your questions, objections, and emphasis based on what happened before.\n\n"
        + "\n\n".join(call_sections)
        + "\n"
    )


def _format_bullets(items: Any) -> str:
    if not isinstance(items, list | tuple):
        return f"- {items}"

    return "\n".join(f"- {item}" for item in items)
