import unittest

from app.models.agent import ScenarioSlug
from app.services.context import assemble_call_context


class AssembleCallContextTests(unittest.TestCase):
    def test_system_instruction_includes_recent_transcript_context(self):
        context = assemble_call_context(
            rep_profile={
                "version": 1,
                "weakest_dimension": "discovery",
                "metric_scores": {"discovery": 4},
            },
            business_profile={
                "name": "AI Sales Coach",
                "framework": "BANT",
                "context_data": {},
                "products": "AI sales coaching",
                "icp": "Sales teams",
                "objections": "Too expensive",
            },
            scenario=ScenarioSlug.cold_call,
            recent_learning_history=[
                {
                    "session_id": "session-1",
                    "scenario": "cold_call",
                    "scorecard": {
                        "overall_score": 6,
                        "needs_discovery_score": 3,
                    },
                    "transcript": [
                        {
                            "speaker": "rep",
                            "text": "Let me show you our platform.",
                        },
                        {
                            "speaker": "ai_customer",
                            "text": "I do not see why this is a priority.",
                        },
                    ],
                }
            ],
        )

        instruction = context["system_instruction"]

        self.assertIn("Recent practice history", instruction)
        self.assertIn("discovery=3", instruction)
        self.assertIn("Let me show you our platform.", instruction)
        self.assertIn("I do not see why this is a priority.", instruction)

    def test_system_instruction_varies_persona_from_recent_history(self):
        base_kwargs = {
            "rep_profile": {"version": 1, "weakest_dimension": "discovery"},
            "business_profile": {
                "name": "AI Sales Coach",
                "framework": "BANT",
                "context_data": {},
                "products": "AI sales coaching",
                "icp": "Sales teams",
                "objections": "Too expensive",
            },
            "scenario": ScenarioSlug.cold_call,
        }

        first = assemble_call_context(
            **base_kwargs,
            recent_learning_history=[{"session_id": "session-a"}],
        )
        second = assemble_call_context(
            **base_kwargs,
            recent_learning_history=[{"session_id": "session-b"}],
        )

        self.assertIn("Persona variation:", first["system_instruction"])
        self.assertIn("Persona variation:", second["system_instruction"])
        self.assertNotEqual(first["system_instruction"], second["system_instruction"])


if __name__ == "__main__":
    unittest.main()
