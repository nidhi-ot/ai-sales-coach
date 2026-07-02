import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app
from tests.helpers import FakeSupabase, clear_auth_override, install_auth_override


class ScorecardRouteTests(unittest.TestCase):
    def setUp(self):
        install_auth_override()
        self.client = TestClient(app)

    def tearDown(self):
        clear_auth_override()

    def test_end_session_persists_generated_scorecard(self):
        fake_supabase = FakeSupabase()
        feedback = {
            "rapport_score": 8,
            "needs_discovery_score": 7,
            "objection_handling_score": 6,
            "closing_score": 9,
            "overall_score": 8,
            "strengths": ["Asked clear discovery questions"],
            "improvement_areas": ["Probe budget earlier"],
            "framework_scores": {"SPIN": 8},
            "feedback_summary": "Strong discovery and clear close.",
        }

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch("app.services.scorecards.get_supabase", return_value=fake_supabase),
            patch(
                "app.services.scorecards.gpt_analyze_transcript",
                new=AsyncMock(return_value=feedback),
            ),
            patch(
                "app.api.routes.sessions.create_next_salesperson_profile",
                new=AsyncMock(return_value={"id": "profile-1"}),
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
                            "text": "Tell me about the current process.",
                            "timestamp_offset_ms": 1000,
                        },
                        {
                            "speaker": "ai_customer",
                            "text": "We lose track of follow-ups.",
                            "timestamp_offset_ms": 2000,
                        },
                    ],
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["score_card_status"], "generated")
        self.assertEqual(len(fake_supabase.store["scorecards"]), 1)
        self.assertEqual(fake_supabase.store["scorecards"][0]["overall_score"], 8)

    def test_end_session_updates_existing_stub_scorecard_without_creating_duplicate(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-123",
                "rep_id": "rep-456",
                "business_id": "business-789",
                "feedback_summary": "Analysis pending (stub).",
                "shared_with_manager": True,
            }
        )

        feedback = {
            "rapport_score": 9,
            "needs_discovery_score": 8,
            "objection_handling_score": 7,
            "closing_score": 8,
            "overall_score": 8,
            "strengths": ["Clear next step"],
            "improvement_areas": [],
            "framework_scores": {},
            "feedback_summary": "Generated analysis.",
        }

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch("app.services.scorecards.get_supabase", return_value=fake_supabase),
            patch(
                "app.services.scorecards.gpt_analyze_transcript",
                new=AsyncMock(return_value=feedback),
            ),
            patch(
                "app.api.routes.sessions.create_next_salesperson_profile",
                new=AsyncMock(return_value={"id": "profile-1"}),
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
                            "text": "Can we agree on a pilot?",
                            "timestamp_offset_ms": 1000,
                        },
                        {
                            "speaker": "ai_customer",
                            "text": "Yes, send the next steps.",
                            "timestamp_offset_ms": 2000,
                        },
                    ],
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(fake_supabase.store["scorecards"]), 1)
        self.assertEqual(fake_supabase.store["scorecards"][0]["id"], "scorecard-1")
        self.assertEqual(
            fake_supabase.store["scorecards"][0]["feedback_summary"], "Generated analysis."
        )
        self.assertTrue(fake_supabase.store["scorecards"][0]["shared_with_manager"])

    def test_history_returns_scorecard_fields_and_share_update_preserves_record(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["sessions"]["session-123"].update(
            {"status": "completed", "duration_seconds": 180}
        )
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-123",
                "rep_id": "rep-456",
                "business_id": "business-789",
                "overall_score": 7,
                "shared_with_manager": False,
                "created_at": "2026-06-25T10:04:00+00:00",
            }
        )

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase),
        ):
            history = self.client.get("/api/v1/sessions/rep/rep-456")
            share = self.client.patch(
                "/api/v1/scorecards/session/session-123/share",
                json={"shared_with_manager": True},
            )
            scorecard = self.client.get("/api/v1/scorecards/session-123")
            history_after_share = self.client.get("/api/v1/sessions/rep/rep-456")

        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.json()[0]["overall_score"], 7)
        self.assertFalse(history.json()[0]["shared_with_manager"])

        self.assertEqual(share.status_code, 200)
        self.assertTrue(share.json()["shared_with_manager"])

        self.assertEqual(scorecard.status_code, 200)
        self.assertEqual(scorecard.json()["id"], "scorecard-1")
        self.assertTrue(scorecard.json()["shared_with_manager"])
        self.assertEqual(len(fake_supabase.store["scorecards"]), 1)

        self.assertTrue(history_after_share.json()[0]["shared_with_manager"])
        self.assertEqual(history_after_share.json()[0]["overall_score"], 7)

    def test_post_scorecard_creates_stub_and_get_by_scorecard_id(self):
        fake_supabase = FakeSupabase()

        with (
            patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase),
            patch("app.services.scorecards.get_supabase", return_value=fake_supabase),
        ):
            create_response = self.client.post(
                "/api/v1/scorecards/",
                json={
                    "session_id": "session-123",
                    "rep_id": "rep-456",
                    "business_id": "business-789",
                },
            )

            self.assertEqual(create_response.status_code, 200)
            created = create_response.json()
            self.assertEqual(created["session_id"], "session-123")
            self.assertEqual(created["feedback_summary"], "Analysis pending (stub).")

            get_response = self.client.get(f"/api/v1/scorecards/{created['id']}")

        self.assertEqual(get_response.status_code, 200)
        fetched = get_response.json()
        self.assertEqual(fetched["id"], created["id"])
        self.assertEqual(fetched["session_id"], "session-123")

    def test_get_scorecard_can_still_lookup_by_session_id(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-123",
                "rep_id": "rep-456",
                "business_id": "business-789",
                "feedback_summary": "Stored scorecard",
                "shared_with_manager": False,
            }
        )

        with patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase):
            response = self.client.get("/api/v1/scorecards/session-123")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], "scorecard-1")

    def test_get_scorecard_hides_other_rep_scorecard(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-123",
                "rep_id": "other-rep",
                "business_id": "business-789",
                "feedback_summary": "Stored scorecard",
                "shared_with_manager": False,
            }
        )

        with patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase):
            response = self.client.get("/api/v1/scorecards/scorecard-1")

        self.assertEqual(response.status_code, 404)

    def test_share_setting_rejects_other_rep_session(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["sessions"]["session-123"]["rep_id"] = "other-rep"
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-123",
                "rep_id": "other-rep",
                "business_id": "business-789",
                "shared_with_manager": False,
            }
        )

        with patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase):
            response = self.client.patch(
                "/api/v1/scorecards/session/session-123/share",
                json={"shared_with_manager": True},
            )

        self.assertEqual(response.status_code, 404)
        self.assertFalse(fake_supabase.store["scorecards"][0]["shared_with_manager"])

    def test_post_scorecard_does_not_overwrite_existing_generated_scorecard(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-123",
                "rep_id": "rep-456",
                "business_id": "business-789",
                "overall_score": 9,
                "rapport_score": 8,
                "feedback_summary": "Generated scorecard",
                "shared_with_manager": False,
            }
        )

        with (
            patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase),
            patch("app.services.scorecards.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.post(
                "/api/v1/scorecards/",
                json={
                    "session_id": "session-123",
                    "rep_id": "rep-456",
                    "business_id": "business-789",
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], "scorecard-1")
        self.assertEqual(payload["overall_score"], 9)
        self.assertEqual(payload["feedback_summary"], "Generated scorecard")
        self.assertEqual(len(fake_supabase.store["scorecards"]), 1)

    def test_end_session_value_error_creates_stub_scorecard_and_persists_it(self):
        fake_supabase = FakeSupabase()

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase),
            patch("app.services.scorecards.get_supabase", return_value=fake_supabase),
            patch(
                "app.api.routes.sessions.analyze_transcript",
                new=AsyncMock(side_effect=ValueError("Transcript incomplete")),
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
            self.assertEqual(payload["score_card_status"], "pending_transcript")
            self.assertEqual(payload["transcript_entries_saved"], 1)
            self.assertEqual(payload["score_card"]["feedback_summary"], "Analysis pending (stub).")

            get_response = self.client.get(f"/api/v1/scorecards/{payload['score_card']['id']}")

        self.assertEqual(len(fake_supabase.store["scorecards"]), 1)
        self.assertEqual(get_response.status_code, 200)
        fetched = get_response.json()
        self.assertEqual(fetched["id"], payload["score_card"]["id"])
        self.assertEqual(fetched["session_id"], "session-123")


if __name__ == "__main__":
    unittest.main()
