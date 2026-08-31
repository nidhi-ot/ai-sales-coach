import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services import gpt_scoring


class GptScoringPromptTests(unittest.IsolatedAsyncioTestCase):
    async def test_scoring_prompt_includes_business_context(self):
        captured: dict[str, str] = {}

        class FakeCompletions:
            async def create(self, **kwargs):
                captured["prompt"] = kwargs["messages"][1]["content"]
                return SimpleNamespace(
                    choices=[
                        SimpleNamespace(
                            message=SimpleNamespace(
                                content=json.dumps(
                                    {
                                        "rapport_score": 8,
                                        "needs_discovery_score": 7,
                                        "objection_handling_score": 6,
                                        "closing_score": 7,
                                        "overall_score": 7,
                                        "framework_scores": {
                                            "BANT": {
                                                "budget": 6,
                                                "authority": 6,
                                                "need": 8,
                                                "timeline": 5,
                                            }
                                        },
                                        "strengths": ["Strong discovery"],
                                        "improvement_areas": ["Handle pricing earlier"],
                                        "feedback_summary": "Solid call.",
                                    }
                                )
                            )
                        )
                    ]
                )

        class FakeClient:
            def __init__(self, **_kwargs):
                self.chat = SimpleNamespace(completions=FakeCompletions())

        with (
            patch.object(gpt_scoring.settings, "openai_api_key", "test-key"),
            patch("app.services.gpt_scoring.AsyncOpenAI", FakeClient),
        ):
            feedback = await gpt_scoring.gpt_analyze_transcript(
                rep_text="How are you coaching reps today?",
                ai_text="Pricing and adoption are concerns.",
                system_instruction="Scenario instruction",
                scenario_title="cold_call",
                business_profile={
                    "products": "AI sales coaching for revenue teams",
                    "icp": "B2B SaaS sales managers",
                    "objections": "Too expensive, reps will not adopt it",
                },
            )

        self.assertEqual(feedback["moments"], [])

        prompt = captured["prompt"]
        self.assertIn("BUSINESS CONTEXT FOR SCORING", prompt)
        self.assertIn("AI sales coaching for revenue teams", prompt)
        self.assertIn("B2B SaaS sales managers", prompt)
        self.assertIn("Too expensive, reps will not adopt it", prompt)
        self.assertIn("this business's ICP and actual products/services", prompt)

    def test_parse_feedback_defaults_missing_moments(self):
        feedback = gpt_scoring._parse_feedback(
            json.dumps(
                {
                    "rapport_score": 8,
                    "needs_discovery_score": 7,
                    "objection_handling_score": 6,
                    "closing_score": 7,
                    "overall_score": 7,
                    "framework_scores": {
                        "BANT": {
                            "budget": 6,
                            "authority": 6,
                            "need": 8,
                            "timeline": 5,
                        }
                    },
                    "strengths": ["Strong discovery"],
                    "improvement_areas": ["Handle pricing earlier"],
                    "feedback_summary": "Solid call.",
                }
            )
        )

        self.assertEqual(feedback.moments, [])


if __name__ == "__main__":
    unittest.main()
