import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from tests.helpers import FakeSupabase


class SessionEndRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id="rep-456")

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_post_end_saves_transcript_and_returns_completed_session(self):
        fake_supabase = FakeSupabase()
        fake_scorecard = {"session_id": "session-123", "status": "processing"}

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch(
                "app.api.routes.sessions.mark_scorecard_processing",
                new=AsyncMock(return_value=fake_scorecard),
            ) as processing_mock,
            patch(
                "app.api.routes.sessions.run_scorecard_pipeline",
                new=AsyncMock(return_value=None),
            ) as pipeline_mock,
        ):
            response = self.client.post(
                "/api/v1/sessions/session-123/end",
                json={
                    "ended_at": "2026-06-25T10:03:00Z",
                    "duration_seconds": 180,
                    "end_reason": "manual",
                    "entries": [
                        {
                            "speaker": "rep",
                            "text": "Hello from rep",
                            "timestamp_offset_ms": 1000,
                        },
                        {
                            "speaker": "ai_customer",
                            "text": "Hello from buyer",
                            "timestamp_offset_ms": 2000,
                        },
                    ],
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["score_card_status"], "processing")
        self.assertEqual(payload["score_card"], fake_scorecard)
        self.assertEqual(payload["transcript_entries_saved"], 2)

        session = payload["session"]
        self.assertEqual(session["id"], "session-123")
        self.assertEqual(session["rep_id"], "rep-456")
        self.assertEqual(session["business_id"], "business-789")
        self.assertEqual(session["scenario"], "cold_call")
        self.assertEqual(session["profile_version"], 3)
        self.assertEqual(session["status"], "completed")
        self.assertEqual(session["duration_seconds"], 180)
        self.assertEqual(session["metadata"], {"system_instruction": "Test scenario"})

        self.assertEqual(len(fake_supabase.store["transcripts"]), 2)
        self.assertEqual(fake_supabase.store["transcripts"][0]["session_id"], "session-123")
        processing_mock.assert_awaited_once_with("session-123")
        pipeline_mock.assert_awaited_once_with("session-123")

    def test_post_end_returns_processing_without_waiting_for_analysis_result(self):
        fake_supabase = FakeSupabase()
        fake_scorecard = {"session_id": "session-123", "status": "processing"}

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch(
                "app.api.routes.sessions.mark_scorecard_processing",
                new=AsyncMock(return_value=fake_scorecard),
            ),
            patch(
                "app.api.routes.sessions.run_scorecard_pipeline",
                new=AsyncMock(return_value=None),
            ) as pipeline_mock,
        ):
            response = self.client.post(
                "/api/v1/sessions/session-123/end",
                json={
                    "ended_at": "2026-06-25T10:03:00Z",
                    "duration_seconds": 180,
                    "end_reason": "manual",
                    "entries": [
                        {
                            "speaker": "rep",
                            "text": "Hello from rep",
                            "timestamp_offset_ms": 1000,
                        }
                    ],
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["score_card_status"], "processing")
        self.assertEqual(payload["score_card"], fake_scorecard)
        pipeline_mock.assert_awaited_once_with("session-123")

    def test_transcript_batch_skips_duplicate_session_timestamp_speaker_keys(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["transcripts"].append(
            {
                "id": "transcript-1",
                "session_id": "session-123",
                "speaker": "rep",
                "text": "Already saved",
                "timestamp_offset_ms": 1000,
            }
        )

        with patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase):
            response = self.client.post(
                "/api/v1/sessions/session-123/transcripts/batch",
                json={
                    "entries": [
                        {
                            "speaker": "rep",
                            "text": "Duplicate text should not matter",
                            "timestamp_offset_ms": 1000,
                        },
                        {
                            "speaker": "ai_customer",
                            "text": "New speaker at same timestamp is allowed",
                            "timestamp_offset_ms": 1000,
                        },
                        {
                            "speaker": "ai_customer",
                            "text": "Duplicate inside same batch",
                            "timestamp_offset_ms": 1000,
                        },
                    ]
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inserted"], 1)
        self.assertEqual(len(fake_supabase.store["transcripts"]), 2)


class TwoCallLearningLoopRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id="rep-456")

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_first_call_generates_profile_version_and_second_call_consumes_it(self):
        fake_supabase = FakeSupabase(with_default_session=False)
        scorecard = {
            "rapport_score": 8,
            "needs_discovery_score": 6,
            "objection_handling_score": 3,
            "closing_score": 7,
            "overall_score": 7,
        }

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch("app.services.scorecards.get_supabase", return_value=fake_supabase),
            patch("app.services.session_analytics.get_supabase", return_value=fake_supabase),
            patch(
                "app.services.scorecards.gpt_analyze_transcript",
                new=AsyncMock(return_value=scorecard),
            ) as gpt_mock,
        ):
            first_start = self.client.post(
                "/api/v1/sessions/",
                json={
                    "rep_id": "rep-456",
                    "business_id": "business-789",
                    "scenario": "cold_call",
                    "system_instruction": "First call",
                },
            )

            self.assertEqual(first_start.status_code, 200)
            first_session = first_start.json()
            self.assertEqual(first_session["profile_version"], 0)

            first_end = self.client.post(
                f"/api/v1/sessions/{first_session['id']}/end",
                json={
                    "ended_at": "2026-06-25T10:03:00Z",
                    "duration_seconds": 180,
                    "end_reason": "manual",
                    "entries": [
                        {
                            "speaker": "rep",
                            "text": "What is slowing your team down today?",
                            "timestamp_offset_ms": 1000,
                        },
                        {
                            "speaker": "ai_customer",
                            "text": "We are struggling with follow-up consistency.",
                            "timestamp_offset_ms": 2000,
                        },
                    ],
                },
            )

            self.assertEqual(first_end.status_code, 200)
            ended_payload = first_end.json()
            self.assertEqual(ended_payload["score_card_status"], "processing")

            second_start = self.client.post(
                "/api/v1/sessions/",
                json={
                    "rep_id": "rep-456",
                    "business_id": "business-789",
                    "scenario": "cold_call",
                    "system_instruction": "Second call",
                },
            )

        self.assertEqual(second_start.status_code, 200)
        second_session = second_start.json()
        self.assertEqual(second_session["profile_version"], 1)
        self.assertEqual(len(fake_supabase.store["salesperson_profiles"]), 1)

        gpt_mock.assert_awaited_once()
        self.assertEqual(fake_supabase.rpc_calls, [])
        stored_profile = fake_supabase.store["salesperson_profiles"][0]
        self.assertEqual(stored_profile["call_id"], first_session["id"])
        self.assertEqual(stored_profile["weakest_dimension"], "objection_handling")


if __name__ == "__main__":
    unittest.main()
