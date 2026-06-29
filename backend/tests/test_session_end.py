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
        self.update_payload = None
        self.insert_payload = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def limit(self, _value):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def update(self, payload):
        self.update_payload = payload
        return self

    def insert(self, payload):
        self.insert_payload = payload
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
            payload = self.insert_payload or []
            if isinstance(payload, dict):
                payload = [payload]
            self.store["transcripts"].extend(payload)
            return SimpleNamespace(data=[dict(item) for item in payload])

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
        }

    def table(self, name):
        return _FakeTable(name, self.store)


class SessionEndRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_post_end_saves_transcript_and_returns_completed_session(self):
        fake_supabase = _FakeSupabase()
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
        fake_supabase = _FakeSupabase()
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


if __name__ == "__main__":
    unittest.main()
