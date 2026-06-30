import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app
from tests.helpers import FakeSupabase


class SessionEndRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_post_end_saves_transcript_and_returns_completed_session(self):
        fake_supabase = FakeSupabase()
        fake_scorecard = {"session_id": "session-123", "overall_score": 8}

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch(
                "app.api.routes.sessions.analyze_transcript",
                new=AsyncMock(return_value=fake_scorecard),
            ) as analyze_mock,
            patch(
                "app.api.routes.sessions.create_next_salesperson_profile",
                new=AsyncMock(return_value={"id": "profile-1"}),
            ) as profile_mock,
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
        self.assertEqual(payload["score_card_status"], "generated")
        self.assertEqual(payload["score_card"], fake_scorecard)
        self.assertEqual(payload["profile_status"], "generated")
        self.assertEqual(payload["profile"], {"id": "profile-1"})
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
        analyze_mock.assert_awaited_once_with("session-123")
        profile_mock.assert_awaited_once_with("session-123", fake_scorecard)

    def test_post_end_keeps_generated_scorecard_status_when_profile_creation_fails(self):
        fake_supabase = FakeSupabase()
        fake_scorecard = {"session_id": "session-123", "overall_score": 8}

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch(
                "app.api.routes.sessions.analyze_transcript",
                new=AsyncMock(return_value=fake_scorecard),
            ),
            patch(
                "app.api.routes.sessions.create_next_salesperson_profile",
                new=AsyncMock(side_effect=ValueError("invalid profile version")),
            ),
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
        self.assertEqual(payload["score_card_status"], "generated")
        self.assertEqual(payload["score_card"], fake_scorecard)
        self.assertIsNone(payload["profile"])
        self.assertEqual(payload["profile_status"], "failed")
        self.assertEqual(payload["profile_detail"], "invalid profile version")


class TwoCallLearningLoopRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

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
            patch("app.services.session_analytics.get_supabase", return_value=fake_supabase),
            patch(
                "app.api.routes.sessions.analyze_transcript",
                new=AsyncMock(return_value=scorecard),
            ) as analyze_mock,
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
            self.assertEqual(ended_payload["profile_status"], "generated")
            self.assertEqual(ended_payload["profile"]["version"], 1)
            self.assertEqual(ended_payload["profile"]["call_id"], first_session["id"])

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

        analyze_mock.assert_awaited_once_with(first_session["id"])
        self.assertEqual(fake_supabase.rpc_calls, [])
        stored_profile = fake_supabase.store["salesperson_profiles"][0]
        self.assertEqual(stored_profile["call_id"], first_session["id"])
        self.assertEqual(stored_profile["weakest_dimension"], "objection_handling")

if __name__ == "__main__":
    unittest.main()
