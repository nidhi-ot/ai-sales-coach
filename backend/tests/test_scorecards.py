import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app


class _FakeTable:
    def __init__(self, name, store):
        self.name = name
        self.store = store
        self.filters = {}
        self.insert_payload = None
        self.update_payload = None
        self.order_column = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def limit(self, _value):
        return self

    def order(self, column, *_args, **_kwargs):
        self.order_column = column
        return self

    def insert(self, payload):
        self.insert_payload = payload
        return self

    def upsert(self, payload, *_args, **_kwargs):
        self.insert_payload = payload
        return self

    def update(self, payload):
        self.update_payload = payload
        return self

    def execute(self):
        if self.name == "sessions":
            session_id = self.filters.get("id")
            row = self.store["sessions"].get(session_id)
            if row is None:
                return SimpleNamespace(data=[])
            if self.update_payload is not None:
                row.update(self.update_payload)
            return SimpleNamespace(data=[dict(row)])

        if self.name == "transcripts":
            if self.insert_payload is not None:
                payload = self.insert_payload
                if isinstance(payload, dict):
                    payload = [payload]
                self.store["transcripts"].extend(payload)
                return SimpleNamespace(data=[dict(item) for item in payload])

            rows = [
                dict(item)
                for item in self.store["transcripts"]
                if item.get("session_id") == self.filters.get("session_id")
            ]
            if self.order_column is not None:
                rows.sort(key=lambda item: item.get(self.order_column, 0))
            return SimpleNamespace(data=rows)

        if self.name == "scorecards":
            if self.insert_payload is not None:
                payload = dict(self.insert_payload)
                existing = None
                for scorecard in self.store["scorecards"]:
                    if scorecard["session_id"] == payload["session_id"]:
                        existing = scorecard
                        break

                if existing is not None:
                    existing.update(payload)
                    row = dict(existing)
                else:
                    row = {
                        "id": payload.get("id") or f"scorecard-{len(self.store['scorecards']) + 1}",
                        "shared_with_manager": False,
                        **payload,
                    }
                    self.store["scorecards"].append(row)

                return SimpleNamespace(data=[dict(row)])

            if self.update_payload is not None:
                for scorecard in self.store["scorecards"]:
                    if scorecard.get("session_id") == self.filters.get("session_id"):
                        scorecard.update(self.update_payload)
                        return SimpleNamespace(data=[dict(scorecard)])
                return SimpleNamespace(data=[])

            rows = [
                dict(item)
                for item in self.store["scorecards"]
                if all(item.get(key) == value for key, value in self.filters.items())
            ]
            return SimpleNamespace(data=rows)

        if self.name == "salesperson_profiles":
            return SimpleNamespace(data=[])

        raise AssertionError(f"Unexpected table access: {self.name}")


class _FakeSupabase:
    def __init__(self):
        self.store = {
            "sessions": {
                "session-123": {
                    "id": "session-123",
                    "rep_id": "rep-456",
                    "business_id": "business-789",
                    "scenario": "cold_call",
                    "profile_version": 3,
                    "status": "active",
                    "started_at": "2026-06-25T10:00:00+00:00",
                    "ended_at": None,
                    "duration_seconds": None,
                    "metadata": {"system_instruction": "Test scenario"},
                }
            },
            "transcripts": [],
            "scorecards": [],
        }

    def table(self, name):
        return _FakeTable(name, self.store)


class ScorecardRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_post_scorecard_creates_stub_and_get_by_scorecard_id(self):
        fake_supabase = _FakeSupabase()

        with patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase), patch(
            "app.services.scorecards.get_supabase", return_value=fake_supabase
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
        fake_supabase = _FakeSupabase()
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

    def test_post_scorecard_does_not_overwrite_existing_generated_scorecard(self):
        fake_supabase = _FakeSupabase()
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

        with patch("app.api.routes.scorecards.get_supabase", return_value=fake_supabase), patch(
            "app.services.scorecards.get_supabase", return_value=fake_supabase
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
        fake_supabase = _FakeSupabase()

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
