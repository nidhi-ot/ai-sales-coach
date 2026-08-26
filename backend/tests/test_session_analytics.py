import unittest
import json

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from app.services import session_analytics
from app.services.session_analytics import (
    ProfileLearningAnalysis,
    create_next_salesperson_profile,
    get_recent_learning_history,
    _request_ai_profile_analysis,
)
from tests.helpers import FakeSupabase


class CreateNextSalespersonProfileTests(unittest.IsolatedAsyncioTestCase):
    
    def test_get_recent_learning_history_returns_completed_calls_with_scorecards_and_transcripts(self):
        fake_supabase = FakeSupabase(with_default_session=False)
        business_id = "22222222-2222-2222-2222-222222222222"

        fake_supabase.store["sessions"].update(
            {
                "session-old": {
                    "id": "session-old",
                    "rep_id": "rep-456",
                    "business_id": business_id,
                    "scenario": "cold_call",
                    "status": "completed",
                    "started_at": "2026-06-24T10:00:00+00:00",
                    "duration_seconds": 300,
                },
                "session-new": {
                    "id": "session-new",
                    "rep_id": "rep-456",
                    "business_id": business_id,
                    "scenario": "hot_call",
                    "status": "completed",
                    "started_at": "2026-06-25T10:00:00+00:00",
                    "duration_seconds": 420,
                },
                "session-active": {
                    "id": "session-active",
                    "rep_id": "rep-456",
                    "business_id": business_id,
                    "scenario": "meeting",
                    "status": "active",
                    "started_at": "2026-06-26T10:00:00+00:00",
                },
            }
        )
        fake_supabase.store["scorecards"].extend(
            [
                {
                    "session_id": "session-old",
                    "overall_score": 5,
                    "rapport_score": 6,
                },
                {
                    "session_id": "session-new",
                    "overall_score": 8,
                    "rapport_score": 9,
                },
            ]
        )
        fake_supabase.store["transcripts"].extend(
            [
                {
                    "session_id": "session-new",
                    "speaker": "ai_customer",
                    "text": "Need proof.",
                    "timestamp_offset_ms": 100,
                },
                {
                    "session_id": "session-new",
                    "speaker": "rep",
                    "text": "What metrics matter?",
                    "timestamp_offset_ms": 200,
                },
            ]
        )

        with patch(
            "app.services.session_analytics.get_supabase",
            return_value=fake_supabase,
        ):
            history = get_recent_learning_history("rep-456", business_id)

        self.assertEqual([row["session_id"] for row in history], ["session-new", "session-old"])
        self.assertEqual(history[0]["scorecard"]["overall_score"], 8)
        self.assertEqual(
            [turn["text"] for turn in history[0]["transcript"]],
            ["Need proof.", "What metrics matter?"],
        )
    
    async def test_create_next_profile_uses_ai_analysis_when_enabled(self):
        fake_supabase = FakeSupabase()
        scorecard = {
            "rapport_score": 9,
            "needs_discovery_score": 3,
            "objection_handling_score": 4,
            "closing_score": 8,
        }
        history = [{"session_id": "session-123"}]
        ai_analysis = ProfileLearningAnalysis(
            weakest_dimension="closing",
            reasoning_summary="Recent transcripts show the rep avoids asking for next steps.",
            evidence=["The rep ended without a concrete close."],
        )

        with (
            patch("app.services.session_analytics.get_supabase", return_value=fake_supabase),
            patch.object(session_analytics.settings, "ai_profile_update_enabled", True),
            patch(
                "app.services.session_analytics.get_recent_learning_history",
                return_value=history,
            ) as history_mock,
            patch(
                "app.services.session_analytics._request_ai_profile_analysis",
                new=AsyncMock(return_value=ai_analysis),
            ) as ai_mock,
        ):
            profile = await create_next_salesperson_profile("session-123", scorecard)

        self.assertEqual(profile["weakest_dimension"], "closing")
        history_mock.assert_called_once_with(
            "rep-456",
            "22222222-2222-2222-2222-222222222222",
        )
        ai_mock.assert_awaited_once_with(scorecard=scorecard, history=history)
    
    async def test_create_next_profile_falls_back_when_ai_analysis_fails(self):
        fake_supabase = FakeSupabase()
        scorecard = {
            "rapport_score": 9,
            "needs_discovery_score": 3,
            "objection_handling_score": 4,
            "closing_score": 8,
        }

        with (
            patch("app.services.session_analytics.get_supabase", return_value=fake_supabase),
            patch.object(session_analytics.settings, "ai_profile_update_enabled", True),
            patch(
                "app.services.session_analytics.get_recent_learning_history",
                return_value=[{"session_id": "session-123"}],
            ),
            patch(
                "app.services.session_analytics._request_ai_profile_analysis",
                new=AsyncMock(side_effect=ValueError("AI unavailable")),
            ),
        ):
            profile = await create_next_salesperson_profile("session-123", scorecard)

        self.assertEqual(profile["weakest_dimension"], "discovery")
        self.assertEqual(len(fake_supabase.store["salesperson_profiles"]), 1)
    
    async def test_create_next_profile_skips_ai_analysis_when_disabled(self):
        fake_supabase = FakeSupabase()
        scorecard = {
            "rapport_score": 9,
            "needs_discovery_score": 3,
            "objection_handling_score": 4,
            "closing_score": 8,
        }

        with (
            patch("app.services.session_analytics.get_supabase", return_value=fake_supabase),
            patch.object(session_analytics.settings, "ai_profile_update_enabled", False),
            patch(
                "app.services.session_analytics._request_ai_profile_analysis",
                new=AsyncMock(),
            ) as ai_mock,
        ):
            profile = await create_next_salesperson_profile("session-123", scorecard)

        self.assertEqual(profile["weakest_dimension"], "discovery")
        ai_mock.assert_not_awaited()

    async def test_request_ai_profile_analysis_uses_profile_model_and_history(self):
        captured: dict[str, Any] = {}

        class FakeCompletions:
            async def create(self, **kwargs):
                captured.update(kwargs)
                return SimpleNamespace(
                    choices=[
                        SimpleNamespace(
                            message=SimpleNamespace(
                                content=json.dumps(
                                    {
                                        "weakest_dimension": "discovery",
                                        "reasoning_summary": "The rep skips discovery questions.",
                                        "evidence": ["Transcript shows early pitching."],
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
            patch("app.services.session_analytics.AsyncOpenAI", FakeClient),
            patch.object(
                __import__("app.services.session_analytics").services.session_analytics.settings,
                "openai_api_key",
                "test-key",
            ),
            patch.object(
                __import__("app.services.session_analytics").services.session_analytics.settings,
                "openai_profile_model",
                "gpt-5.5",
            ),
        ):
            analysis = await _request_ai_profile_analysis(
                scorecard={"needs_discovery_score": 4, "closing_score": 8},
                history=[
                    {
                        "session_id": "session-1",
                        "transcript": [
                            {"speaker": "rep", "text": "Let me show you our platform."}
                        ],
                    }
                ],
            )

        self.assertEqual(analysis.weakest_dimension, "discovery")
        self.assertEqual(captured["model"], "gpt-5.5")
        self.assertIn("Let me show you our platform.", captured["messages"][1]["content"])

    async def test_creates_next_profile_version_with_table_insert(self):
        fake_supabase = FakeSupabase()
        scorecard = {
            "rapport_score": 8,
            "needs_discovery_score": 6,
            "objection_handling_score": 4,
            "closing_score": 7,
        }

        with patch(
            "app.services.session_analytics.get_supabase",
            return_value=fake_supabase,
        ):
            profile = await create_next_salesperson_profile("session-123", scorecard)

        self.assertEqual(fake_supabase.rpc_calls, [])
        self.assertEqual(len(fake_supabase.store["salesperson_profiles"]), 1)

        created = fake_supabase.store["salesperson_profiles"][0]
        self.assertEqual(profile["id"], created["id"])
        self.assertEqual(created["rep_id"], "rep-456")
        self.assertEqual(created["business_id"], "22222222-2222-2222-2222-222222222222")
        self.assertEqual(created["call_id"], "session-123")
        self.assertEqual(created["version"], 1)
        self.assertEqual(created["weakest_dimension"], "objection_handling")
        self.assertEqual(
            created["metric_scores"],
            {
                "rapport": 8,
                "discovery": 6,
                "objection_handling": 4,
                "closing": 7,
            },
        )

    async def test_allocates_version_after_existing_profile(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["salesperson_profiles"].append(
            {
                "id": "profile-1",
                "rep_id": "rep-456",
                "business_id": "22222222-2222-2222-2222-222222222222",
                "version": 1,
                "call_id": "old-session",
                "metric_scores": {},
                "weakest_dimension": "rapport",
            }
        )
        scorecard = {
            "rapport_score": 8,
            "needs_discovery_score": 6,
            "objection_handling_score": 4,
            "closing_score": 7,
        }

        with patch(
            "app.services.session_analytics.get_supabase",
            return_value=fake_supabase,
        ):
            profile = await create_next_salesperson_profile("session-123", scorecard)

        self.assertEqual(profile["version"], 2)
        self.assertEqual(len(fake_supabase.store["salesperson_profiles"]), 2)

    async def test_allocates_version_within_session_business(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["salesperson_profiles"].append(
            {
                "id": "profile-other-business",
                "rep_id": "rep-456",
                "business_id": "business-other",
                "version": 9,
                "call_id": "old-session",
                "metric_scores": {},
                "weakest_dimension": "rapport",
            }
        )
        scorecard = {
            "rapport_score": 8,
            "needs_discovery_score": 6,
            "objection_handling_score": 4,
            "closing_score": 7,
        }

        with patch(
            "app.services.session_analytics.get_supabase",
            return_value=fake_supabase,
        ):
            profile = await create_next_salesperson_profile("session-123", scorecard)

        self.assertEqual(profile["business_id"], "22222222-2222-2222-2222-222222222222")
        self.assertEqual(profile["version"], 1)
        self.assertEqual(len(fake_supabase.store["salesperson_profiles"]), 2)


if __name__ == "__main__":
    unittest.main()
