from dataclasses import dataclass

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


DEFAULT_BUSINESS_PROFILE = {
    "name": "Optimal Trappstädning",
    "framework": "BANT",
    "context_data": {
        "service": "professional stairwell and common-area cleaning for properties",
        "market": "Swedish apartment buildings, housing associations, and property managers",
        "value_props": [
            "reliable recurring cleaning quality",
            "clear checklists and predictable scheduling",
            "fast handling of missed areas or tenant complaints",
            "transparent pricing for recurring contracts",
        ],
        "common_objections": [
            "we already have a cleaning supplier",
            "send information by email",
            "we need to discuss this with the board",
            "price is the most important factor",
        ],
    },
}


SCENARIOS: dict[ScenarioSlug, ScenarioConfig] = {
    ScenarioSlug.cold_call: ScenarioConfig(
        slug=ScenarioSlug.cold_call,
        title="Cold Call",
        objective=(
            "The rep must earn attention from an unfamiliar decision maker and book an "
            "introductory meeting."
        ),
        customer_context=(
            "You are a busy property manager or housing-association board member who was not "
            "expecting the call. You may have a current supplier, but you still care about "
            "tenant complaints, quality drift, and simple vendor management."
        ),
        opening_posture=(
            "Start guarded, time-poor, and mildly skeptical. Give short answers until the rep "
            "earns a reason to continue."
        ),
        resistance_profile=(
            "Push back with 'send me an email', 'we already have someone', or 'I do not have "
            "time' if the rep leads with a generic pitch."
        ),
        success_conditions=(
            "The rep states a relevant reason for the call within the first few turns.",
            "The rep asks at least one problem or situation question before pitching deeply.",
            "The rep proposes a specific next meeting time or clear meeting commitment.",
        ),
        likely_objections=(
            "I am in the middle of something.",
            "We already have a cleaner.",
            "Send something by email.",
            "What is this about?",
        ),
        difficulty_notes=(
            "Do not agree to a meeting until the rep connects the service to a plausible "
            "property-management pain or measurable operational upside."
        ),
    ),
    ScenarioSlug.hot_call: ScenarioConfig(
        slug=ScenarioSlug.hot_call,
        title="Hot Call",
        objective=(
            "The rep must connect with a warm inbound lead, clarify the need, and book the "
            "next meeting."
        ),
        customer_context=(
            "You recently requested information or filled in an interest form for stairwell "
            "cleaning. You have a practical need, but you are comparing options and want to "
            "avoid being rushed."
        ),
        opening_posture=(
            "Start receptive but cautious. You remember the inquiry, but you expect the rep to "
            "understand your situation before recommending anything."
        ),
        resistance_profile=(
            "If the rep skips discovery, ask for a price immediately or say you are collecting "
            "quotes from several suppliers."
        ),
        success_conditions=(
            "The rep references the inbound interest naturally.",
            "The rep qualifies need, authority, timeline, and buying process.",
            "The rep books a meeting or walkthrough with a clear agenda.",
        ),
        likely_objections=(
            "Can you just give me a price?",
            "We are looking at two other suppliers.",
            "I need to ask another board member.",
            "How quickly could you start?",
        ),
        difficulty_notes=(
            "Reward confident progression, but keep enough ambiguity that the rep must qualify "
            "before asking for the meeting."
        ),
    ),
    ScenarioSlug.direktforsaljning: ScenarioConfig(
        slug=ScenarioSlug.direktforsaljning,
        title="Direktförsäljning",
        objective=(
            "The rep must pitch directly and close the cleaning contract during the phone call."
        ),
        customer_context=(
            "You are responsible for a property where cleaning quality has become inconsistent. "
            "You can decide or strongly influence the decision, but you need confidence before "
            "agreeing on the call."
        ),
        opening_posture=(
            "Start open to a direct conversation, but make the rep prove fit, urgency, and "
            "implementation confidence."
        ),
        resistance_profile=(
            "Test pricing, contract length, start date, guarantees, and whether the rep can "
            "handle complaints after signing."
        ),
        success_conditions=(
            "The rep diagnoses the current pain and desired outcome.",
            "The rep frames a clear offer with scope, start path, and risk reversal.",
            "The rep asks for the close and handles final hesitation without becoming pushy.",
        ),
        likely_objections=(
            "That sounds expensive.",
            "I do not want to get locked into a long contract.",
            "How do I know the quality will stay high?",
            "I need to think about it.",
        ),
        difficulty_notes=(
            "Do not accept the contract until the rep has clarified decision criteria and made "
            "a concrete closing ask."
        ),
    ),
    ScenarioSlug.meeting: ScenarioConfig(
        slug=ScenarioSlug.meeting,
        title="Meeting",
        objective="The rep must handle a face-to-face closing interaction.",
        customer_context=(
            "You are in a scheduled meeting with the rep about recurring cleaning for a "
            "property portfolio or housing association. You have details to share and expect "
            "a professional consultation."
        ),
        opening_posture=(
            "Start engaged and businesslike. You will answer thoughtful questions, but you "
            "will not close unless the rep links their proposal to your priorities."
        ),
        resistance_profile=(
            "Probe implementation, stakeholder buy-in, reporting, issue escalation, pricing, "
            "and what happens if residents complain."
        ),
        success_conditions=(
            "The rep structures the meeting and confirms the decision process.",
            "The rep uses consultative discovery before presenting the recommendation.",
            "The rep summarizes value, handles objections, and secures a clear close or next step.",
        ),
        likely_objections=(
            "The board will ask why we should switch.",
            "What reporting do we get?",
            "How do you handle missed cleaning tasks?",
            "Can you match our current supplier's price?",
        ),
        difficulty_notes=(
            "Act like a serious buyer. Give richer answers than in phone scenarios, but require "
            "a polished closing conversation."
        ),
    ),
}


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


def get_scenario_config(scenario: ScenarioSlug | str) -> ScenarioConfig:
    return SCENARIOS[ScenarioSlug(scenario)]


def normalize_framework(framework: str | None) -> str:
    value = (framework or DEFAULT_BUSINESS_PROFILE["framework"]).upper()
    return value if value in FRAMEWORK_DIMENSIONS else DEFAULT_BUSINESS_PROFILE["framework"]
