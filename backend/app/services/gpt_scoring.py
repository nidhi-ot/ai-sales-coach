import json
from typing import Any

from app.config import settings

from openai import AsyncOpenAI


async def gpt_analyze_transcript(
    rep_text: str,
    ai_text: str,
    system_instruction: str,
    scenario_title: str
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
    
    prompt = f"""You are an expert sales coach evaluating a practice sales call for an AI Sales Coach platform.

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
  "improvement_areas": ["area 1", "area 2", "area 3"]
}}"""
    
    response = await client.chat.completions.create(
        model=settings.openai_analysis_model,
        messages=[
            {
                "role": "system",
                "content": "You are an expert sales coach. Analyze sales calls and provide constructive feedback. Always respond with valid JSON only.",
            },
            {
                "role": "user",
                "content": prompt,
            }
        ],
        max_completion_tokens=1000,
    )
    
    response_text = response.choices[0].message.content.strip()
    
    # Handle potential markdown code blocks in response
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    elif response_text.startswith("```"):
        response_text = response_text[3:]
    
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    
    response_text = response_text.strip()
    
    feedback = json.loads(response_text)
    
    # Validate and normalize response
    normalized = {
        # Sales Execution Skills
        "rapport_score": _bounded_score(feedback.get("rapport_score", 5)),
        "needs_discovery_score": _bounded_score(feedback.get("needs_discovery_score", 5)),
        "objection_handling_score": _bounded_score(feedback.get("objection_handling_score", 5)),
        "closing_score": _bounded_score(feedback.get("closing_score", 5)),
        "overall_score": _bounded_score(feedback.get("overall_score", 5)),
        # BANT Framework Scores
        "budget_score": _bounded_score(feedback.get("budget_score", 5)),
        "authority_score": _bounded_score(feedback.get("authority_score", 5)),
        "need_score": _bounded_score(feedback.get("need_score", 5)),
        "timeline_score": _bounded_score(feedback.get("timeline_score", 5)),
        "bant_overall_score": _bounded_score(feedback.get("bant_overall_score", 5)),
        "framework_scores": {
            "budget": _bounded_score(feedback.get("budget_score", 5)),
            "authority": _bounded_score(feedback.get("authority_score", 5)),
            "need": _bounded_score(feedback.get("need_score", 5)),
            "timeline": _bounded_score(feedback.get("timeline_score", 5)),
        },
        "strengths": feedback.get("strengths", []),
        "improvement_areas": feedback.get("improvement_areas", []),
    }
    
    # Ensure strengths and improvement_areas are lists of strings
    if not isinstance(normalized["strengths"], list):
        normalized["strengths"] = []
    if not isinstance(normalized["improvement_areas"], list):
        normalized["improvement_areas"] = []
    
    normalized["strengths"] = [str(s) for s in normalized["strengths"]]
    normalized["improvement_areas"] = [str(s) for s in normalized["improvement_areas"]]
    
    return normalized


def _bounded_score(score: int) -> int:
    """Ensure score is between 1 and 10."""
    try:
        score_int = int(score)
    except (ValueError, TypeError):
        score_int = 5
    return max(1, min(10, score_int))
