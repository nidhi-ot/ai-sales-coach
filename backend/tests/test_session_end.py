import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.api.deps import CurrentAccount, get_current_account, get_current_user
from app.main import app
from tests.helpers import FakeSupabase

BUSINESS_ID = "22222222-2222-2222-2222-222222222222"
OTHER_BUSINESS_ID = "33333333-3333-3333-3333-333333333333"


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
        self.assertEqual(session["business_id"], BUSINESS_ID)
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

    def test_tab_close_end_saves_pending_transcript_and_queues_scorecard(self):
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
                    "ended_at": "2026-06-25T10:01:20Z",
                    "duration_seconds": 80,
                    "end_reason": "tab_closed",
                    "entries": [
                        {
                            "speaker": "rep",
                            "text": "I wanted to ask how you handle coaching today.",
                            "timestamp_offset_ms": 1000,
                        }
                    ],
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["score_card_status"], "processing")
        self.assertEqual(payload["transcript_entries_saved"], 1)
        self.assertEqual(fake_supabase.store["sessions"]["session-123"]["status"], "completed")
        self.assertEqual(
            fake_supabase.store["transcripts"][0]["text"],
            "I wanted to ask how you handle coaching today.",
        )
        processing_mock.assert_awaited_once_with("session-123")
        pipeline_mock.assert_awaited_once_with("session-123")

    def test_end_without_any_transcript_marks_session_abandoned_and_skips_scoring(self):
        fake_supabase = FakeSupabase()

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch(
                "app.api.routes.sessions.mark_scorecard_processing",
                new=AsyncMock(),
            ) as processing_mock,
            patch(
                "app.api.routes.sessions.run_scorecard_pipeline",
                new=AsyncMock(),
            ) as pipeline_mock,
        ):
            response = self.client.post(
                "/api/v1/sessions/session-123/end",
                json={
                    "ended_at": "2026-06-25T10:00:15Z",
                    "duration_seconds": 15,
                    "end_reason": "manual",
                    "entries": [],
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["session"]["status"], "abandoned")
        self.assertEqual(payload["transcript_entries_saved"], 0)
        self.assertIsNone(payload["score_card_status"])
        self.assertIsNone(payload["score_card"])
        self.assertEqual(fake_supabase.store["scorecards"], [])
        processing_mock.assert_not_awaited()
        pipeline_mock.assert_not_awaited()

    def test_end_with_only_duplicate_entries_still_scores_stored_transcript(self):
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
        fake_scorecard = {"session_id": "session-123", "status": "processing"}

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch(
                "app.api.routes.sessions.mark_scorecard_processing",
                new=AsyncMock(return_value=fake_scorecard),
            ) as processing_mock,
            patch(
                "app.api.routes.sessions.run_scorecard_pipeline",
                new=AsyncMock(),
            ) as pipeline_mock,
        ):
            response = self.client.post(
                "/api/v1/sessions/session-123/end",
                json={
                    "ended_at": "2026-06-25T10:01:00Z",
                    "duration_seconds": 60,
                    "end_reason": "manual",
                    "entries": [
                        {
                            "speaker": "rep",
                            "text": "Duplicate payload",
                            "timestamp_offset_ms": 1000,
                        }
                    ],
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["session"]["status"], "completed")
        self.assertEqual(payload["transcript_entries_saved"], 0)
        self.assertEqual(payload["score_card_status"], "processing")
        processing_mock.assert_awaited_once_with("session-123")
        pipeline_mock.assert_awaited_once_with("session-123")

    def test_rep_history_excludes_abandoned_sessions(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["sessions"]["session-abandoned"] = {
            "id": "session-abandoned",
            "rep_id": "rep-456",
            "business_id": BUSINESS_ID,
            "scenario": "cold_call",
            "status": "abandoned",
            "started_at": "2026-06-25T11:00:00+00:00",
            "duration_seconds": 5,
        }

        with patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase):
            response = self.client.get("/api/v1/sessions/rep/rep-456")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["id"] for row in response.json()], ["session-123"])

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

    def test_transcript_batch_redacts_pii_before_persistence(self):
        fake_supabase = FakeSupabase()

        with patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase):
            response = self.client.post(
                "/api/v1/sessions/session-123/transcripts/batch",
                json={
                    "entries": [
                        {
                            "speaker": "rep",
                            "text": "Ring mig på 070-123 45 67 eller anna@example.com",
                            "timestamp_offset_ms": 2000,
                        }
                    ]
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inserted"], 1)

        saved = fake_supabase.store["transcripts"][-1]

        self.assertEqual(
            saved["text"],
            "Ring mig på [PHONE] eller [EMAIL]",
        )

    def test_heartbeat_updates_metadata_without_losing_existing_session_context(self):
        fake_supabase = FakeSupabase()

        with patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase):
            response = self.client.post(
                "/api/v1/sessions/session-123/heartbeat",
                json={"heartbeat_at": "2026-06-25T10:01:00Z"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["session_id"], "session-123")
        self.assertEqual(payload["heartbeat_at"], "2026-06-25T10:01:00+00:00")
        self.assertEqual(
            fake_supabase.store["sessions"]["session-123"]["metadata"],
            {
                "system_instruction": "Test scenario",
                "heartbeat_at": "2026-06-25T10:01:00+00:00",
            },
        )


class TwoCallLearningLoopRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id="rep-456")
        app.dependency_overrides[get_current_account] = lambda: CurrentAccount(
            id="rep-456",
            role="rep",
            business_id=BUSINESS_ID,
        )

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
            "strengths": ["Good rapport building"],
            "improvement_areas": ["Objection handling"],
            "feedback_summary": "Strong call overall",
            "framework_scores": {},
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
                    "business_id": BUSINESS_ID,
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
                    "business_id": BUSINESS_ID,
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

    def test_create_session_rejects_request_business_outside_account(self):
        fake_supabase = FakeSupabase(with_default_session=False)

        with (
            patch(
                "app.api.routes.sessions.get_supabase",
                return_value=fake_supabase,
            ) as supabase_mock,
            patch("app.api.routes.sessions.get_business_profile", new=AsyncMock()) as business_mock,
        ):
            response = self.client.post(
                "/api/v1/sessions/",
                json={
                    "rep_id": "rep-456",
                    "business_id": OTHER_BUSINESS_ID,
                    "scenario": "cold_call",
                    "system_instruction": "Cross-business call",
                },
            )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(fake_supabase.store["sessions"], {})
        supabase_mock.assert_not_called()
        business_mock.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
