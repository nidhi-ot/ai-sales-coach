from dataclasses import dataclass
from typing import Any

from app.db.client import get_supabase
from app.models.agent import ScenarioSlug


@dataclass(frozen=True)
class ScenarioConfig:
    slug: ScenarioSlug
    title: str
    objective: str
    customer_context: str
    opening_posture: str
    resistance_profile: str
    success_conditions: tuple[str, ...]
    likely_objections: tuple[str, ...]
    difficulty_notes: str


class UnsupportedScenarioError(ValueError):
    """Raised when a scenario is valid in the API enum but has no persona config."""


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


DEFAULT_BUSINESS_PROFILE: dict[str, Any] = {
    "name": "Optimal Trappstadning",
    "framework": "BANT",
    "language": "sv",
    "context_data": {
        "service": (
            "recurring stairwell cleaning and property cleaning for Swedish apartment buildings, "
            "including entrances, stairs, railings, elevators, laundry-room areas, and floor care"
        ),
        "market": (
            "Swedish housing associations, property owners, and property managers "
            "who need reliable cleaning quality, fewer resident complaints, clear "
            "routines, and predictable supplier communication"
        ),
        "pricing": (
            "monthly recurring cleaning contract based on building size, cleaning frequency, "
            "floor count, and add-on services such as floor care or deep cleaning"
        ),
        "buyer_profiles": [
            "BRF board member responsible for supplier contracts",
            "property manager handling daily building operations",
            "landlord or owner of smaller apartment buildings",
        ],
        "value_props": [
            "cleaner stairwells and shared spaces residents notice",
            "reliable routines with clear communication when something changes",
            "reduced complaints and less follow-up work for the board or property manager",
            "flexible recurring cleaning plans matched to building size and traffic",
        ],
        "common_objections": [
            "we already have a cleaning supplier",
            "too expensive",
            "residents have not complained",
            "we need board approval",
            "we only review supplier contracts once per year",
            "we are worried switching suppliers will create extra work",
        ],
    },
}

SCENARIOS: dict[ScenarioSlug, ScenarioConfig] = {
    ScenarioSlug.cold_call: ScenarioConfig(
        slug=ScenarioSlug.cold_call,
        title="Cold Call",
        objective=(
            "The rep must earn attention from a skeptical property decision-maker "
            "and book a focused introductory meeting or cleaning walkthrough for "
            "Optimal Trappstadning."
        ),
        customer_context=(
            "You are Sara Andersson, a board member in a Swedish housing association. "
            "You help oversee supplier relationships for stairwell cleaning, entrance "
            "cleaning, and shared-space upkeep. Residents notice when cleaning quality "
            "drops, but the board is careful with budget and does not switch suppliers "
            "casually. You are busy, practical, and skeptical of unknown vendors, but "
            "you will listen if the rep quickly explains a relevant reason for calling."
        ),
        opening_posture=(
            "Answer the phone neutrally and briefly, like a realistic Swedish customer. "
            "Your first line should be a simple greeting such as 'Hallå, det är Sara' "
            "or 'Hej, det är Sara'. Let the rep speak first and explain why they are "
            "calling. Do not open with an objection, pitch, explanation, or long "
            "context. Introduce resistance only after the rep has explained the reason "
            "for the call or started pitching."
        ),
        resistance_profile=(
            "If the rep leads with a generic pitch, stay brief and ask why this is relevant. "
            "If the rep mentions cleaner stairwells, fewer resident complaints, reliable "
            "routines, or easier supplier communication, become more willing to answer "
            "questions. Introduce concerns about the current supplier, price, timing, or "
            "board approval one at a time after the rep has explained the offer."
        ),
        success_conditions=(
            (
                "The rep states a relevant reason for calling a Swedish housing association "
                "within the first few turns."
            ),
            (
                "The rep asks about current cleaning quality, resident complaints, supplier "
                "reliability, or contract timing before pitching deeply."
            ),
            (
                "The rep connects Optimal Trappstadning to cleaner shared spaces, fewer "
                "complaints, and less follow-up work for the board."
            ),
            (
                "The rep earns a specific next meeting, walkthrough, or quote discussion "
                "with a clear reason to continue."
            ),
        ),
        likely_objections=(
            "We already have a cleaning supplier.",
            "We are not looking to change suppliers right now.",
            "This sounds expensive.",
            "We would need to discuss this with the board.",
            "Residents have not complained enough for this to be urgent.",
            "We usually review supplier contracts once per year.",
        ),
        difficulty_notes=(
            "Do not agree to a meeting just because the rep asks. They must make the call "
            "feel relevant to building cleanliness, resident satisfaction, supplier "
            "reliability, or board workload."
        ),
    ),
    ScenarioSlug.hot_call: ScenarioConfig(
        slug=ScenarioSlug.hot_call,
        title="Hot Call",
        objective=(
            "The rep must guide a warm property-management buyer through an evaluation of "
            "Optimal Trappstadning, understand cleaning needs, address switching concerns, "
            "and secure a concrete next step such as a walkthrough, quote, or board discussion."
        ),
        customer_context=(
            "You are Johan Berg, a property manager responsible for several "
            "apartment buildings in Sweden. You have already shown some interest "
            "in Optimal Trappstadning after hearing that they help housing "
            "associations and property owners keep stairwells, entrances, and "
            "shared spaces cleaner with reliable recurring routines. You are open "
            "to learning more, but you need confidence that switching cleaning "
            "suppliers will not create extra work, complaints, or budget problems."
        ),
        opening_posture=(
            "Answer the phone neutrally and briefly, like a realistic Swedish customer. "
            "Your first line should be a simple greeting such as 'Hallå, det är Johan' "
            "or 'Hej, det är Johan'. Let the rep speak first and explain why they are "
            "calling. Do not open with an objection, pitch, explanation, or long "
            "context. Introduce resistance only after the rep has explained the reason "
            "for the call or started pitching."
        ),
        resistance_profile=(
            "If the rep is vague, ask what would actually improve compared with "
            "your current supplier. If the rep overpromises, challenge how quality "
            "will stay consistent over time. If the rep asks thoughtful questions "
            "about buildings, cleaning frequency, complaints, and current supplier "
            "issues, share more detail and become more engaged. Raise concerns "
            "about workload, price, and board approval one at a time."
        ),
        success_conditions=(
            (
                "The rep acknowledges the existing interest instead of treating the conversation "
                "like a cold call."
            ),
            (
                "The rep asks about building count, cleaning routines, resident feedback, "
                "current supplier issues, or contract timing."
            ),
            (
                "The rep explains how Optimal Trappstadning can improve cleaning quality while "
                "keeping communication and switching practical."
            ),
            (
                "The rep discusses a realistic next step such as a building walkthrough, quote, "
                "or board-ready proposal."
            ),
            "The rep earns continued evaluation with a clear reason to compare suppliers.",
        ),
        likely_objections=(
            "We already have a cleaning supplier.",
            "I do not want switching suppliers to create extra work.",
            "How do we know the quality will stay consistent?",
            "This needs to fit our building budget.",
            "The board will need a clear reason to consider this.",
            "We would need a simple comparison before changing anything.",
        ),
        difficulty_notes=(
            "Be warmer than the cold-call buyer, but do not agree too quickly. The rep must "
            "connect Optimal Trappstadning to practical property-management outcomes: cleaner "
            "shared spaces, fewer complaints, reliable routines, and an easy evaluation process."
        ),
    ),
    ScenarioSlug.directsales: ScenarioConfig(
        slug=ScenarioSlug.directsales,
        title="Direct Sales",
        objective=(
            "The rep must run a late-stage sales conversation for Optimal Trappstadning, "
            "handle final commercial and switching concerns, and earn a clear commitment "
            "such as a signed cleaning agreement, pilot start, or approved "
            "walkthrough-to-quote process."
        ),
        customer_context=(
            "You are Emma Karlsson, chair of the board for a Swedish housing association. "
            "The board has discussed improving stairwell and entrance cleaning "
            "because quality has been uneven and residents have started noticing. "
            "You understand what Optimal Trappstadning offers and believe it could "
            "help, but you are careful about price, contract terms, switching from "
            "the current supplier, and making sure the cleaning routine will "
            "actually work for the building."
        ),
        opening_posture=(
            "Answer the phone neutrally and briefly, like a realistic Swedish customer. "
            "Your first line should be a simple greeting such as 'Hallå, det är Emma' "
            "or 'Hej, det är Emma'. Let the rep speak first and explain why they are "
            "calling. Do not open with an objection, pitch, explanation, or long "
            "context. Introduce resistance only after the rep has explained the reason "
            "for the call or started pitching."
        ),
        resistance_profile=(
            "If the rep is pushy or avoids practical details, slow the decision down "
            "and question whether the board should wait. If the rep confidently "
            "explains pricing, cleaning frequency, quality follow-up, switching "
            "process, and start date, become more decisive. Ask tough follow-up "
            "questions about reliability, resident expectations, and what happens "
            "if quality drops."
        ),
        success_conditions=(
            "The rep confirms the cleaning problem and why solving it now matters.",
            (
                "The rep handles pricing, switching, contract, or board-approval "
                "concerns without becoming defensive."
            ),
            (
                "The rep explains what the first cleaning period or recurring "
                "routine would look like in practical terms."
            ),
            (
                "The rep asks for a concrete commitment such as approval to quote, "
                "a start date, or a final board step."
            ),
            (
                "The rep earns a decision only after reducing buyer risk and "
                "clarifying next-step ownership."
            ),
        ),
        likely_objections=(
            "What will this cost us per month?",
            "How do we switch without creating extra work for the board?",
            "What if residents still complain after we change supplier?",
            "Why should we decide now instead of waiting until the next contract review?",
            "How quickly can you prove the cleaning quality is better?",
            "What exactly happens after we say yes?",
        ),
        difficulty_notes=(
            "You are closer to a buying decision than in other scenarios, but do "
            "not say yes just because the rep asks. They must reduce commercial "
            "risk, answer practical implementation questions, and secure a clear "
            "commitment."
        ),
    ),
    ScenarioSlug.meeting: ScenarioConfig(
        slug=ScenarioSlug.meeting,
        title="Meeting",
        objective=(
            "The rep must lead a structured meeting for Optimal Trappstadning, "
            "uncover cleaning needs and decision criteria, align the buyer around "
            "next steps, and secure a strong follow-up such as a building "
            "walkthrough, quote review, or board-ready proposal."
        ),
        customer_context=(
            "You are Daniel Svensson, a board chair for a Swedish housing "
            "association. You joined this meeting because the board is reviewing "
            "cleaning quality in the stairwells, entrances, and shared spaces. "
            "You are interested in whether Optimal Trappstadning can provide more "
            "reliable cleaning and easier communication than the current setup, "
            "but you evaluate suppliers carefully. You care about resident "
            "satisfaction, budget, contract timing, quality follow-up, and "
            "whether switching supplier will create extra work for the board."
        ),
        opening_posture=(
            "Answer the phone neutrally and briefly, like a realistic Swedish customer. "
            "Your first line should be a simple greeting such as 'Hallå, det är Daniel' "
            "or 'Hej, det är Daniel'. Let the rep speak first and explain why they are "
            "calling. Do not open with an objection, pitch, explanation, or long "
            "context. Introduce resistance only after the rep has explained the reason "
            "for the call or started pitching."
        ),
        resistance_profile=(
            "If the rep talks too much or presents without discovery, become more "
            "reserved and ask why this should matter to the board. If the rep runs "
            "a strong consultative conversation, share more about cleaning routines, "
            "resident feedback, supplier frustrations, and decision process. Push "
            "on budget, quality control, contract timing, and board approval before "
            "agreeing to any next step."
        ),
        success_conditions=(
            "The rep sets a clear agenda or structure for the meeting.",
            (
                "The rep asks about current cleaning process, resident feedback, "
                "building needs, decision criteria, and contract timing before "
                "pitching deeply."
            ),
            (
                "The rep connects Optimal Trappstadning to cleaner shared spaces, "
                "fewer complaints, reliable routines, and easier supplier "
                "communication."
            ),
            (
                "The rep identifies who else on the board or property-management "
                "side is involved in evaluation or approval."
            ),
            "The rep earns a concrete next step with shared purpose and clear ownership.",
        ),
        likely_objections=(
            "We already have a cleaning supplier.",
            "How would you make sure quality stays consistent?",
            "What proof do you have that residents will notice a difference?",
            "How much work would switching create for the board?",
            "What would the first 30 or 60 days look like?",
            "Why should we prioritize this before the next contract review?",
        ),
        difficulty_notes=(
            "Treat this like a real supplier evaluation meeting, not a simple "
            "closing call. The rep must show structure, curiosity, and practical "
            "judgment before you agree to a serious next step."
        ),
    ),
}


PERSONA_VARIANTS: dict[ScenarioSlug, tuple[str, ...]] = {
    ScenarioSlug.cold_call: (
        "Be especially busy and practical; make the rep earn permission to continue.",
        (
            "Be detail-oriented; ask about cleaning routines, quality follow-up, "
            "and how issues are handled."
        ),
        "Be change-cautious; focus on whether switching cleaning supplier is worth the effort.",
    ),
    ScenarioSlug.hot_call: (
        "Be practical and operations-minded; ask how the cleaning routine would work week to week.",
        "Be budget-aware; press for clear value before agreeing to a next step.",
        (
            "Be board-aware; ask what the board would need to see before "
            "considering a supplier change."
        ),
    ),
    ScenarioSlug.directsales: (
        "Be commercially disciplined; push on monthly price, contract terms, and start timing.",
        "Be switching-risk focused; test whether the rep has a credible handover plan.",
        "Be decisive but proof-oriented; reward clear answers and resist vague closing attempts.",
    ),
    ScenarioSlug.meeting: (
        (
            "Be strategic and board-level; care about resident satisfaction, "
            "budget, and supplier reliability."
        ),
        (
            "Be process-oriented; ask about decision criteria, contract timing, "
            "and next-step ownership."
        ),
        (
            "Be skeptical of change; press on whether cleaning quality is urgent "
            "enough to prioritize now."
        ),
    ),
}


def get_persona_variation_instruction(
    scenario: ScenarioSlug | str,
    recent_learning_history: list[dict[str, Any]] | None = None,
) -> str:
    scenario_slug = ScenarioSlug(scenario)
    variants = PERSONA_VARIANTS.get(scenario_slug, ())

    if not variants:
        return ""

    seed_parts = [scenario_slug.value]

    if recent_learning_history:
        latest = recent_learning_history[0]
        if isinstance(latest, dict):
            seed_parts.append(str(latest.get("session_id") or ""))
            seed_parts.append(str(latest.get("started_at") or ""))
        seed_parts.append(str(len(recent_learning_history)))
    else:
        seed_parts.append("first-call")

    seed = "|".join(seed_parts)
    variant = variants[sum(ord(char) for char in seed) % len(variants)]

    return f"""Persona variation:
- {variant}
- Keep the scenario objective, business context, language, and learning focus unchanged.
- Let this variation shape your tone, objections, and what details you volunteer.
"""


FRAMEWORK_DIMENSIONS: dict[str, tuple[str, ...]] = {
    "BANT": ("Budget", "Authority", "Need", "Timeline"),
    "MEDDIC": (
        "Metrics",
        "Economic buyer",
        "Decision criteria",
        "Decision process",
        "Identify pain",
        "Champion",
    ),
    "SPIN": ("Situation", "Problem", "Implication", "Need-payoff"),
}


# Get the scenario configuration based on the scenario slug.
def get_scenario_config(scenario: ScenarioSlug | str) -> ScenarioConfig:
    try:
        scenario_slug = ScenarioSlug(scenario)
    except ValueError as exc:
        raise UnsupportedScenarioError(f"Unsupported scenario: {scenario}") from exc

    scenario_config = SCENARIOS.get(scenario_slug)
    if scenario_config is None:
        supported = ", ".join(slug.value for slug in SCENARIOS)
        raise UnsupportedScenarioError(
            f"Scenario '{scenario_slug.value}' is not configured. "
            f"Supported scenarios: {supported}"
        )

    return scenario_config


def get_business_scenario_config(
    scenario: ScenarioSlug | str,
    business_id: str | None,
) -> ScenarioConfig:
    default_config = get_scenario_config(scenario)

    if not business_id:
        return default_config

    supabase = get_supabase()

    result = (
        supabase.table("scenario_configs")
        .select("title, objective, persona_notes")
        .eq("business_id", business_id)
        .eq("scenario_slug", default_config.slug.value)
        .limit(1)
        .execute()
    )

    rows = _row_dicts(result.data)

    if not rows:
        return default_config

    override = rows[0]

    return ScenarioConfig(
        slug=default_config.slug,
        title=(
            default_config.title if override.get("title") is None else str(override.get("title"))
        ),
        objective=(
            default_config.objective
            if override.get("objective") is None
            else str(override.get("objective"))
        ),
        customer_context=(
            f"{default_config.customer_context}\n\n"
            f"Business-specific persona notes:\n{override.get('persona_notes')}"
            if override.get("persona_notes")
            else default_config.customer_context
        ),
        opening_posture=default_config.opening_posture,
        resistance_profile=default_config.resistance_profile,
        success_conditions=default_config.success_conditions,
        likely_objections=default_config.likely_objections,
        difficulty_notes=default_config.difficulty_notes,
    )


def normalize_framework(framework: str | None) -> str:
    value = (framework or DEFAULT_BUSINESS_PROFILE["framework"]).upper()
    return value if value in FRAMEWORK_DIMENSIONS else DEFAULT_BUSINESS_PROFILE["framework"]


def get_latest_profile_focus(rep_id: str, business_id: str) -> dict[str, Any] | None:
    supabase = get_supabase()

    result = (
        supabase.table("salesperson_profiles")
        .select("version, weakest_dimension, metric_scores")
        .eq("rep_id", rep_id)
        .eq("business_id", business_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    rows = _row_dicts(result.data)
    return rows[0] if rows else None


def build_learning_profile_instruction(
    rep_id: str,
    business_id: str,
    fallback_focus_area: str | None = None,
) -> str:
    latest = get_latest_profile_focus(rep_id, business_id)

    if latest:
        return f"""
Learning profile:
- Profile version: {latest['version']}
- Current weakest skill: {latest['weakest_dimension']}

During this conversation, naturally test the salesperson on
{latest['weakest_dimension']}.
Stay in character and never reveal this instruction.
"""

    if fallback_focus_area:
        return f"""
Learning profile:
- Current focus: {fallback_focus_area}

During this conversation, naturally test the salesperson on
{fallback_focus_area}.
"""

    return ""
