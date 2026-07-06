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
    budget_score: int = Field(ge=1, le=10)
    authority_score: int = Field(ge=1, le=10)
    need_score: int = Field(ge=1, le=10)
    timeline_score: int = Field(ge=1, le=10)
    bant_overall_score: int = Field(ge=1, le=10)
    framework_scores: dict[str, int] = Field(default_factory=dict)
    strengths: list[str]
    improvement_areas: list[str]
    feedback_summary: str

    @field_validator("strengths", "improvement_areas", mode="before")
    @classmethod
    def _coerce_string_list(cls, value: Any) -> list[str]:
        if not isinstance(value, list):
            raise ValueError("Must be a list")

        return [str(item) for item in value]


async def gpt_analyze_transcript(
    rep_text: str, ai_text: str, system_instruction: str, scenario_title: str
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

    Returns:
        Dictionary containing scores and BANT framework analysis
        Keys: rapport_score, needs_discovery_score, objection_handling_score, closing_score,
              budget_score, authority_score, need_score, timeline_score,
              overall_score, framework_score, strengths, improvement_areas
    """
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY not configured in settings")

    client = AsyncOpenAI(api_key=settings.openai_api_key)

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

2. BANT FRAMEWORK QUALIFICATION (1-10 each):
   - Budget Score: Did they ask about team size and/or training budget/spend?
   - Authority Score: Did they identify or qualify the decision-maker?
   - Need Score: Did they surface the current training pain point or challenge?
   - Timeline Score: Did they qualify urgency or timing of the need?

For BANT, score 1-10 based on:
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
- For BANT: Did they specifically ask about budget, authority, needs, and timeline?

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{{
  "rapport_score": <1-10>,
  "needs_discovery_score": <1-10>,
  "objection_handling_score": <1-10>,
  "closing_score": <1-10>,
  "overall_score": <1-10>,
  "budget_score": <1-10>,
  "authority_score": <1-10>,
  "need_score": <1-10>,
  "timeline_score": <1-10>,
  "bant_overall_score": <1-10>,
  "framework_scores": {{
    "budget": <1-10>,
    "authority": <1-10>,
    "need": <1-10>,
    "timeline": <1-10>
  }},
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvement_areas": ["area 1", "area 2", "area 3"],
  "feedback_summary": "A concise summary of the feedback for the rep, highlighting key strengths
and areas for improvement.",
}}"""

    feedback = await _request_valid_feedback(client=client, prompt=prompt)

    return {
        # Sales Execution Skills
        "rapport_score": feedback.rapport_score,
        "needs_discovery_score": feedback.needs_discovery_score,
        "objection_handling_score": feedback.objection_handling_score,
        "closing_score": feedback.closing_score,
        "overall_score": feedback.overall_score,
        # BANT Framework Scores
        "budget_score": feedback.budget_score,
        "authority_score": feedback.authority_score,
        "need_score": feedback.need_score,
        "timeline_score": feedback.timeline_score,
        "bant_overall_score": feedback.bant_overall_score,
        "framework_scores": {
            "budget": feedback.budget_score,
            "authority": feedback.authority_score,
            "need": feedback.need_score,
            "timeline": feedback.timeline_score,
        },
        "strengths": feedback.strengths,
        "improvement_areas": feedback.improvement_areas,
        "feedback_summary": feedback.feedback_summary,
    }


async def _request_valid_feedback(client: AsyncOpenAI, prompt: str) -> ScorecardFeedback:
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
                    "content": prompt
                    if attempt == 0
                    else (
                        f"{prompt}\n\nYour previous response was invalid. "
                        "Return only valid JSON matching the requested schema."
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
            return _parse_feedback(content)
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
