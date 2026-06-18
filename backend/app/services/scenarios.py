from dataclasses import dataclass
from typing import Any

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


DEFAULT_BUSINESS_PROFILE: dict[str, Any] = {
    "name": "AI Sales Coach",
    "framework": "BANT",
    "context_data": {
        "service": (
            "AI-powered sales practice software where reps rehearse realistic calls with "
            "buyer personas before speaking with live prospects"
        ),
        "market": (
            "B2B SaaS and sales-led companies with growing teams, onboarding pressure, "
            "inconsistent role-play quality, and managers who cannot personally coach every call"
        ),
        "pricing": (
            "30-day pilot for 5 to 15 reps, then team pricing around $79 per rep per month "
            "plus a $499 per month manager workspace; enterprise pricing depends on seats, "
            "integrations, and custom personas"
        ),
        "buyer_profiles": [
            (
                "VP Sales or Head of Sales responsible for ramp, pipeline quality, and "
                "manager leverage"
            ),
            "Sales enablement leader standardizing messaging and objection handling",
            "Founder-led SaaS team trying to coach sellers without adding more meetings",
        ],
        "value_props": [
            (
                "reps can practice cold calls, discovery, objection handling, and closing "
                "without risking live pipeline"
            ),
            (
                "AI buyers stay in character across a full call and respond to the rep's "
                "actual approach"
            ),
            "managers get repeatable coaching moments without sitting in every role-play",
            (
                "custom personas reflect the team's ICP, buying process, language, and common "
                "objections"
            ),
        ],
        "common_objections": [
            "AI cant replace coaching",
            "too expensive",
            "my team wont adopt it",
            "we already use call recording or enablement tools",
            "I do not trust AI to sound like our real buyers",
            "we do not have time to set this up",
        ],
    },
}


SCENARIOS: dict[ScenarioSlug, ScenarioConfig] = {
    ScenarioSlug.cold_call: ScenarioConfig(
        slug=ScenarioSlug.cold_call,
        title="Cold Call",
        objective=(
            "The rep must earn attention from a skeptical Head of Sales and book a focused "
            "introductory meeting or pilot discussion for AI Sales Coach."
        ),
        customer_context=(
            "You are Sarah Mitchell, Head of Sales at Nimbus Analytics, a growing B2B SaaS "
            "company. You lead 15 Account Executives, 6 SDRs, and 3 Sales Managers. You report "
            "to the CRO and are responsible for revenue attainment, rep productivity, new-hire "
            "ramp time, sales coaching effectiveness, and forecast accuracy. Your team is growing, "
            "but new reps take 4-6 months to become productive, role plays happen inconsistently, "
            "managers spend too much time on repetitive coaching, discovery quality varies by rep, "
            "and objection handling is uneven. You believe great managers create great "
            "sales teams. You are not anti-AI, but you are skeptical of AI vendors that promise "
            "transformation without proving adoption, realism, and business impact."
        ),
        opening_posture=(
            "This is a true cold call. Start brisk, guarded, and time-poor between forecast work "
            "and a pipeline review. Give short answers at first. You may say "
            "'We are not looking at more sales software'. Do not become hostile, but do not "
            "become friendly too quickly."
        ),
        resistance_profile=(
            "If the rep leads with hype, push back with 'AI cant replace coaching', 'too "
            "expensive', or 'my team wont adopt it'. If the rep asks thoughtful discovery "
            "questions, gradually share real challenges and become more engaged. If the rep "
            "pitches too early, become shorter and more skeptical."
        ),
        success_conditions=(
            (
                "The rep states a relevant reason for calling a SaaS Head of Sales within the "
                "first few turns."
            ),
            (
                "The rep asks about ramp, manager coaching capacity, adoption risk, or current "
                "role-play process before pitching deeply."
            ),
            (
                "The rep positions AI Sales Coach as manager leverage and practice, not a "
                "replacement for human coaching."
            ),
            (
                "The rep earns a specific next meeting, pilot discussion, or evaluation step "
                "with a clear reason to attend."
            ),
        ),
        likely_objections=(
            "I am between forecast calls. What is this about?",
            "AI cant replace coaching.",
            "This sounds too expensive for a 15-person team.",
            "My team wont adopt it.",
            "We already have Gong, enablement content, and manager role-plays.",
            "How do I know the AI buyer will sound like our actual customers?",
            "What is this about?",
            "How is this different from every other coaching platform?",
        ),
        difficulty_notes=(
            "Do not agree to a meeting until the rep connects the product to a real sales-team "
            "pain, handles at least one of your adoption or coaching concerns, and avoids "
            "claiming that AI replaces sales managers."
        ),
    ),
    ScenarioSlug.hot_call: ScenarioConfig(
        slug=ScenarioSlug.hot_call,
        title="Hot Call",
        objective=(
            "The rep must guide an interested Sales Manager through a warm evaluation of "
            "AI Sales Coach, validate business needs, address adoption and ROI concerns, "
            "and secure a concrete next step such as a pilot, stakeholder review, or "
            "evaluation meeting."
        ),
        customer_context=(
            "You are Jordan Lee, Sales Manager at Nimbus Analytics, a growing B2B SaaS "
            "company. You manage a team of Account Executives and SDRs and report to the "
            "VP of Sales. You recently attended a demo of AI Sales Coach and agreed to a "
            "follow-up conversation because your team struggles with inconsistent coaching, "
            "uneven objection handling, and long ramp times for new hires. You are interested "
            "in the solution, but you still need confidence that it feels realistic, will be "
            "adopted by reps, and can create measurable business impact. Any recommendation "
            "you make will ultimately need support from sales leadership."
        ),
        opening_posture=(
            "This is a warm call. You are open to the conversation, remember the previous "
            "demo, and are willing to engage. However, you are busy and practical. You want "
            "the rep to quickly explain how AI Sales Coach helps your team and why it is "
            "different from existing coaching and enablement tools."
        ),
        resistance_profile=(
            "If the rep is vague, ask for specific examples and outcomes. If the rep "
            "overpromises, challenge claims about AI replacing managers or magically "
            "improving performance. If the rep asks thoughtful questions and connects "
            "the product to real coaching challenges, become more engaged and share "
            "additional details about onboarding pressure, coaching consistency, and "
            "rep performance gaps."
        ),
        success_conditions=(
            (
                "The rep acknowledges the prior demo or existing interest instead of treating "
                "the conversation like a cold call."
            ),
            (
                "The rep asks about team size, onboarding process, coaching workflow, "
                "or current sales training challenges."
            ),
            (
                "The rep explains how AI Sales Coach complements managers and existing "
                "sales tools rather than replacing them."
            ),
            (
                "The rep discusses measurable outcomes such as ramp time, coaching capacity, "
                "discovery quality, objection handling, or rep performance."
            ),
            (
                "The rep earns a pilot discussion, stakeholder review, or other concrete "
                "next step with a clear reason to continue evaluation."
            ),
        ),
        likely_objections=(
            "How realistic are the AI buyer personas?",
            "Will my reps actually use this consistently?",
            "How much setup and maintenance does this require?",
            "How do we measure whether it improves performance?",
            "How is this different from Gong, enablement content, or manager role-plays?",
            "What evidence do you have that teams actually adopt it?",
            "How quickly would we expect to see results?",
            "I need a strong business case before I bring this to my VP.",
        ),
        difficulty_notes=(
            "Be noticeably warmer than the cold_call persona, but do not agree too quickly. "
            "The rep must still earn the next step by demonstrating business value, "
            "addressing adoption concerns, and building a credible case for evaluation. "
            "Do not commit to a pilot or leadership review unless the rep connects the "
            "solution to real sales-team challenges and measurable outcomes."
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


# Get the scenario configuration based on the scenario slug.
def get_scenario_config(scenario: ScenarioSlug | str) -> ScenarioConfig:
    return SCENARIOS[ScenarioSlug(scenario)]


def normalize_framework(framework: str | None) -> str:
    value = (framework or DEFAULT_BUSINESS_PROFILE["framework"]).upper()
    return value if value in FRAMEWORK_DIMENSIONS else DEFAULT_BUSINESS_PROFILE["framework"]
