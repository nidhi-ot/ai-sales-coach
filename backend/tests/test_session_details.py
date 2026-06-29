import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


class _FakeTable:
    def __init__(self, name, store):
        self.name = name
        self.store = store
        self.filters = {}
        self.order_field = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def limit(self, _value):
        return self

    def order(self, field, *_args, **_kwargs):
        self.order_field = field
        return self

    def execute(self):
        if self.name == "sessions":
            session_id = self.filters.get("id")
            row = self.store["sessions"].get(session_id)
            return SimpleNamespace(data=[dict(row)] if row else [])

        if self.name == "transcripts":
            session_id = self.filters.get("session_id")
            rows = [
                dict(item)
                for item in self.store["transcripts"]
                if item.get("session_id") == session_id
            ]
            if self.order_field == "timestamp_offset_ms":
                rows.sort(key=lambda item: item.get("timestamp_offset_ms") or 0)
            return SimpleNamespace(data=rows)

        if self.name == "scorecards":
            session_id = self.filters.get("session_id")
            rows = [
                dict(item)
                for item in self.store["scorecards"]
                if item.get("session_id") == session_id
            ]
            return SimpleNamespace(data=rows)

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
                    "status": "completed",
                    "started_at": "2026-06-25T10:00:00+00:00",
                    "ended_at": "2026-06-25T10:03:00+00:00",
                    "duration_seconds": 180,
                    "metadata": {"system_instruction": "Test scenario"},
                }
            },
            "transcripts": [
                {
                    "id": "t-2",
                    "session_id": "session-123",
                    "speaker": "ai_customer",
                    "text": "Hello from buyer",
                    "timestamp_offset_ms": 2000,
                    "created_at": "2026-06-25T10:00:02+00:00",
                },
                {
                    "id": "t-1",
                    "session_id": "session-123",
                    "speaker": "rep",
                    "text": "Hello from rep",
                    "timestamp_offset_ms": 1000,
                    "created_at": "2026-06-25T10:00:01+00:00",
                },
            ],
            "scorecards": [
                {
                    "id": "scorecard-1",
                    "session_id": "session-123",
                    "overall_score": 8,
                }
            ],
        }

    def table(self, name):
        return _FakeTable(name, self.store)


class SessionDetailsRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_get_session_details_returns_full_session_payload(self):
        fake_supabase = _FakeSupabase()

        with patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase):
            response = self.client.get("/api/v1/sessions/session-123")

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(payload["id"], "session-123")
        self.assertEqual(payload["title"], "Cold Call")
        self.assertEqual(payload["status"], "completed")
        self.assertEqual(payload["created_at"], "2026-06-25T10:00:00+00:00")
        self.assertEqual(payload["ended_at"], "2026-06-25T10:03:00+00:00")
        self.assertEqual(payload["duration"], 180)
        self.assertEqual(payload["scenario"], "cold_call")
        self.assertEqual(payload["scorecard_id"], "scorecard-1")
        self.assertEqual(len(payload["transcript"]), 2)
        self.assertEqual(payload["transcript"][0]["speaker"], "rep")
        self.assertEqual(payload["transcript"][1]["speaker"], "ai_customer")

    def test_get_session_details_returns_404_for_unknown_session(self):
        fake_supabase = _FakeSupabase()

        with patch("app.api.routes.sessions.get_supabase", return_value=fake_supabase):
            response = self.client.get("/api/v1/sessions/unknown-session")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Session not found")


if __name__ == "__main__":
    unittest.main()
