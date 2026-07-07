import json
from typing import Any

from openai import AsyncOpenAI
from pydantic import BaseModel, Field, ValidationError, field_validator

from app.config import settings


class ScorecardFeedback(BaseModel):
    rapport_score: int = Field(ge=1, le=10)
    needs_discovery_score: int = Field(ge=1, le=10)
    objection_handling_score: int = Field(ge=1, le=10)
    closing_score: int = Field(ge=1, le=10)
    overall_score: int = Field(ge=1, le=10)
    framework_scores: dict[str, Any]
    strengths: list[str]
    improvement_areas: list[str]
    feedback_summary: str

    @field_validator("strengths", "improvement_areas", mode="before")
    @classmethod
    def _coerce_string_list(cls, value: Any) -> list[str]:
        if not isinstance(value, list):
            raise ValueError("Must be a list")

        return [str(item) for item in value]


FRAMEWORKS: dict[str, dict[str, Any]] = {
    "BANT": {
        "name": "BANT",
        "dimensions": {
            "budget": "Did they ask about team size and/or training budget/spend?",
            "authority": "Did they identify or qualify the decision-maker?",
            "need": "Did they surface the current training pain point or challenge?",
            "timeline": "Did they qualify urgency or timing of the need?",
        },
        "criteria": "Did they specifically ask about budget, authority, needs, and timeline?",
    },
    "MEDDIC": {
        "name": "MEDDIC",
        "dimensions": {
            "metrics": "Did they quantify business impact, outcomes, or success metrics?",
            "economic_buyer": "Did they identify or qualify the economic buyer?",
            "decision_criteria": "Did they uncover how the buyer will evaluate the solution?",
            "decision_process": "Did they clarify the steps, stakeholders, and timing to decide?",
            "identify_pain": "Did they uncover a specific, business-relevant pain?",
            "champion": "Did they identify or develop an internal advocate?",
        },
        "criteria": (
            "Did they qualify metrics, economic buyer, decision criteria, decision process, "
            "identified pain, and champion?"
        ),
    },
    "SPIN": {
        "name": "SPIN",
        "dimensions": {
            "situation": "Did they understand the buyer's current situation and context?",
            "problem": "Did they uncover clear problems or dissatisfaction?",
            "implication": "Did they explore the consequences or cost of the problem?",
            "need_payoff": "Did they connect the solution to buyer-stated value or payoff?",
        },
        "criteria": (
            "Did they ask effective situation, problem, implication, and need-payoff questions?"
        ),
    },
}


async def gpt_analyze_transcript(
    rep_text: str,
    ai_text: str,
    system_instruction: str,
    scenario_title: str,
    framework: str = "BANT",
) -> dict[str, Any]:
    """
    Analyze a sales call transcript using GPT-5.5 to generate scorecard feedback.

    ⚠️ CRITICAL: This function runs ASYNC AFTER the call, NEVER during live call.
    This is OFF THE AUDIO PATH for real-time performance.

    Args:
        rep_text: The sales representative's spoken text
        ai_text: The AI customer's responses
        system_instruction: The scenario system instruction/context
        scenario_title: The scenario title for context
        framework: Sales methodology snapshotted on the session

    Returns:
        Dictionary containing universal scores and framework-specific analysis
        Keys: rapport_score, needs_discovery_score, objection_handling_score, closing_score,
              overall_score, framework_scores, strengths, improvement_areas
    """
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY not configured in settings")

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    selected_framework = _normalize_framework(framework)
    framework_prompt = _framework_prompt_section(selected_framework)
    framework_json = _framework_json_shape(selected_framework)

    prompt = f"""You are an expert sales coach evaluating a practice sales call.
You are part of an AI Sales Coach platform.

SCENARIO: {scenario_title}

SCENARIO CONTEXT & INSTRUCTIONS:
{system_instruction}

SALES REPRESENTATIVE'S TRANSCRIPT:
{rep_text}

CUSTOMER'S RESPONSES:
{ai_text}

TASK:
Analyze this sales call on two dimensions:

1. SALES EXECUTION SKILLS (1-10 each):
   - Rapport Score: How well did they build connection and establish trust?
   - Needs Discovery Score: Did they ask effective discovery questions?
   - Objection Handling Score: How well did they handle customer objections?
   - Closing Score: Did they secure a clear next step or closing action?

{framework_prompt}

For {selected_framework}, score each framework dimension 1-10 based on:
- 10: Clearly identified and qualified
- 7-9: Partially addressed or mentioned
- 4-6: Vaguely touched on
- 1-3: Not addressed or poorly handled

EVALUATION CRITERIA:
- Did the rep build rapport and establish connection?
- Did they ask effective discovery questions?
- How well did they handle any objections?
- Did they secure a clear next step or closing action?
- Was their speaking pace, tone, and language professional?
- Did they listen and respond to customer concerns?
- For {selected_framework}: {FRAMEWORKS[selected_framework]["criteria"]}

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{{
  "rapport_score": <1-10>,
  "needs_discovery_score": <1-10>,
  "objection_handling_score": <1-10>,
  "closing_score": <1-10>,
  "overall_score": <1-10>,
  "framework_scores": {framework_json},
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvement_areas": ["area 1", "area 2", "area 3"],
  "feedback_summary": "A concise summary of the feedback for the rep, highlighting key strengths
and areas for improvement."
}}"""

    feedback = await _request_valid_feedback(
        client=client,
        prompt=prompt,
        framework=selected_framework,
    )
    framework_scores = _validated_framework_scores(
        framework_scores=feedback.framework_scores,
        framework=selected_framework,
    )

    return {
        # Sales Execution Skills
        "rapport_score": feedback.rapport_score,
        "needs_discovery_score": feedback.needs_discovery_score,
        "objection_handling_score": feedback.objection_handling_score,
        "closing_score": feedback.closing_score,
        "overall_score": feedback.overall_score,
        "framework_scores": framework_scores,
        "strengths": feedback.strengths,
        "improvement_areas": feedback.improvement_areas,
        "feedback_summary": feedback.feedback_summary,
    }


async def _request_valid_feedback(
    client: AsyncOpenAI,
    prompt: str,
    framework: str,
) -> ScorecardFeedback:
    last_error: Exception | None = None

    for attempt in range(2):
        response = await client.chat.completions.create(
            model=settings.openai_analysis_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert sales coach. Analyze sales calls and provide "
                        "constructive feedback. Always respond with valid JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        prompt
                        if attempt == 0
                        else (
                            f"{prompt}\n\nYour previous response was invalid. "
                            "Return only valid JSON matching the requested schema."
                        )
                    ),
                },
            ],
            max_completion_tokens=1000,
        )

        content = response.choices[0].message.content
        if content is None:
            last_error = ValueError("GPT returned empty response")
            continue

        try:
            feedback = _parse_feedback(content)
            _validated_framework_scores(feedback.framework_scores, framework)
            return feedback
        except (json.JSONDecodeError, ValidationError, ValueError) as exc:
            last_error = exc

    raise ValueError(f"GPT returned invalid scorecard JSON: {last_error}") from last_error


def _parse_feedback(response_text: str) -> ScorecardFeedback:
    response_text = response_text.strip()

    # Handle potential markdown code blocks in response
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    elif response_text.startswith("```"):
        response_text = response_text[3:]

    if response_text.endswith("```"):
        response_text = response_text[:-3]

    feedback = json.loads(response_text.strip())
    return ScorecardFeedback.model_validate(feedback)


def _normalize_framework(framework: str | None) -> str:
    value = (framework or "BANT").upper()
    return value if value in FRAMEWORKS else "BANT"


def _framework_prompt_section(framework: str) -> str:
    dimensions = FRAMEWORKS[framework]["dimensions"]
    dimension_lines = "\n".join(
        f"   - {label.replace('_', ' ').title()} Score: {description}"
        for label, description in dimensions.items()
    )

    return f"2. {framework} FRAMEWORK QUALIFICATION (1-10 each):\n{dimension_lines}"


def _framework_json_shape(framework: str) -> str:
    dimensions = FRAMEWORKS[framework]["dimensions"]
    score_lines = ",\n    ".join(f'"{label}": <1-10>' for label in dimensions)
    return f'{{\n    "{framework}": {{\n    {score_lines}\n    }}\n  }}'


def _validated_framework_scores(
    framework_scores: dict[str, Any],
    framework: str,
) -> dict[str, dict[str, int]]:
    dimensions = FRAMEWORKS[framework]["dimensions"]
    raw_scores = framework_scores.get(framework)

    if raw_scores is None and all(key in framework_scores for key in dimensions):
        raw_scores = framework_scores

    if not isinstance(raw_scores, dict):
        raise ValueError(f"GPT response missing {framework} framework_scores")

    normalized_scores: dict[str, int] = {}

    for dimension in dimensions:
        if dimension not in raw_scores:
            raise ValueError(f"GPT response missing {framework}.{dimension} score")

        normalized_scores[dimension] = _bounded_score(raw_scores[dimension])

    return {framework: normalized_scores}


def _bounded_score(score: Any) -> int:
    try:
        score_int = int(score)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid score: {score}") from exc

    if score_int < 1 or score_int > 10:
        raise ValueError(f"Score out of range: {score}")

    return score_int
