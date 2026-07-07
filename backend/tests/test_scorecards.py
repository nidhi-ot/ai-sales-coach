import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from tests.helpers import FakeSupabase


class ScorecardRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id="rep-456")

    def tearDown(self):
        app.dependency_overrides.clear()

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
                "app.services.scorecards.create_next_salesperson_profile",
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
        self.assertEqual(response.json()["score_card_status"], "processing")
        self.assertEqual(len(fake_supabase.store["scorecards"]), 1)
        self.assertEqual(fake_supabase.store["scorecards"][0]["overall_score"], 8)
        self.assertEqual(fake_supabase.store["scorecards"][0]["status"], "generated")

    def test_end_session_updates_existing_stub_scorecard_without_creating_duplicate(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-123",
                "rep_id": "rep-456",
                "business_id": "business-789",
                "feedback_summary": "Analysis pending (stub).",
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
                "app.services.scorecards.create_next_salesperson_profile",
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
        self.assertTrue(fake_supabase.store["scorecards"][0])

    def test_meddic_session_scores_against_snapshotted_framework(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["sessions"]["session-123"]["metadata"] = {
            "system_instruction": "Test scenario",
            "framework": "MEDDIC",
        }
        feedback = {
            "rapport_score": 8,
            "needs_discovery_score": 7,
            "objection_handling_score": 6,
            "closing_score": 7,
            "overall_score": 7,
            "strengths": ["Quantified business pain"],
            "improvement_areas": ["Clarify decision process"],
            "framework_scores": {
                "MEDDIC": {
                    "metrics": 7,
                    "economic_buyer": 6,
                    "decision_criteria": 7,
                    "decision_process": 5,
                    "identify_pain": 8,
                    "champion": 6,
                }
            },
            "feedback_summary": "Solid MEDDIC discovery.",
        }

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch("app.services.scorecards.get_supabase", return_value=fake_supabase),
            patch(
                "app.services.scorecards.gpt_analyze_transcript",
                new=AsyncMock(return_value=feedback),
            ) as gpt_mock,
            patch(
                "app.services.scorecards.create_next_salesperson_profile",
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
                            "text": "How do you measure onboarding success?",
                            "timestamp_offset_ms": 1000,
                        },
                        {
                            "speaker": "ai_customer",
                            "text": "Ramp time and manager adoption matter most.",
                            "timestamp_offset_ms": 2000,
                        },
                    ],
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            fake_supabase.store["scorecards"][0]["framework_scores"],
            feedback["framework_scores"],
        )
        self.assertEqual(gpt_mock.await_args.kwargs["framework"], "MEDDIC")

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
                "created_at": "2026-06-25T10:04:00+00:00",
            }
        )

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase),
        ):
            history = self.client.get("/api/v1/sessions/rep/rep-456")
            scorecard = self.client.get("/api/v1/scorecards/session-123")

        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.json()[0]["overall_score"], 7)

        self.assertEqual(scorecard.status_code, 200)
        self.assertEqual(scorecard.json()["id"], "scorecard-1")
        self.assertEqual(len(fake_supabase.store["scorecards"]), 1)

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
            }
        )

        with patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase):
            response = self.client.get("/api/v1/scorecards/session-123")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], "scorecard-1")

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

    def test_reprocess_rejects_scorecard_already_processing(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-123",
                "rep_id": "rep-456",
                "business_id": "business-789",
                "overall_score": None,
                "status": "processing",
                "feedback_summary": "Analysis processing.",
            }
        )

        with (
            patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.scorecards.run_scorecard_pipeline", new=AsyncMock()) as pipeline,
        ):
            response = self.client.post("/api/v1/scorecards/session/session-123/reprocess")

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["detail"], "Scorecard is already processing")
        pipeline.assert_not_awaited()

    def test_end_session_value_error_creates_stub_scorecard_and_persists_it(self):
        fake_supabase = FakeSupabase()

        with (
            patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase),
            patch("app.services.scorecards.get_supabase", return_value=fake_supabase),
            patch(
                "app.services.scorecards.gpt_analyze_transcript",
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
            self.assertEqual(payload["score_card_status"], "processing")
            self.assertEqual(payload["transcript_entries_saved"], 1)
            self.assertEqual(payload["score_card"]["feedback_summary"], "Analysis processing.")

            get_response = self.client.get(f"/api/v1/scorecards/{payload['score_card']['id']}")

        self.assertEqual(len(fake_supabase.store["scorecards"]), 1)
        self.assertEqual(fake_supabase.store["scorecards"][0]["status"], "failed")
        self.assertEqual(get_response.status_code, 200)
        fetched = get_response.json()
        self.assertEqual(fetched["id"], payload["score_card"]["id"])
        self.assertEqual(fetched["session_id"], "session-123")


if __name__ == "__main__":
    unittest.main()
