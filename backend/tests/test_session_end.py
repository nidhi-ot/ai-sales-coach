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


class _LearningLoopFakeRpc:
    def __init__(self, supabase, name, params):
        self.supabase = supabase
        self.name = name
        self.params = params

    def execute(self):
        self.supabase.rpc_calls.append((self.name, self.params))

        rep_profiles = [
            profile
            for profile in self.supabase.store["salesperson_profiles"]
            if profile["rep_id"] == self.params["p_rep_id"]
        ]
        next_version = max((profile["version"] for profile in rep_profiles), default=0) + 1

        profile = {
            "id": f"profile-{next_version}",
            "rep_id": self.params["p_rep_id"],
            "business_id": self.params["p_business_id"],
            "version": next_version,
            "call_id": self.params["p_call_id"],
            "metric_scores": self.params["p_metric_scores"],
            "weakest_dimension": self.params["p_weakest_dimension"],
        }
        self.supabase.store["salesperson_profiles"].append(profile)
        return SimpleNamespace(data=profile)


class _LearningLoopFakeTable:
    def __init__(self, name, store):
        self.name = name
        self.store = store
        self.filters = {}
        self.insert_payload = None
        self.update_payload = None
        self.order_column = None
        self.order_desc = False
        self.limit_value = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def order(self, column, *_args, **kwargs):
        self.order_column = column
        self.order_desc = bool(kwargs.get("desc", False))
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def insert(self, payload):
        self.insert_payload = payload
        return self

    def update(self, payload):
        self.update_payload = payload
        return self

    def execute(self):
        if self.name == "sessions":
            if self.insert_payload is not None:
                row = {
                    "id": f"session-{len(self.store['sessions']) + 1}",
                    **self.insert_payload,
                }
                self.store["sessions"][row["id"]] = row
                return SimpleNamespace(data=[dict(row)])

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

                rows = []
                for item in payload:
                    row = {
                        "id": f"transcript-{len(self.store['transcripts']) + 1}",
                        **item,
                    }
                    self.store["transcripts"].append(row)
                    rows.append(dict(row))

                return SimpleNamespace(data=rows)

            rows = [
                dict(item)
                for item in self.store["transcripts"]
                if all(item.get(key) == value for key, value in self.filters.items())
            ]
            if self.limit_value is not None:
                rows = rows[: self.limit_value]
            return SimpleNamespace(data=rows)

        if self.name == "salesperson_profiles":
            rows = [
                dict(profile)
                for profile in self.store["salesperson_profiles"]
                if all(profile.get(key) == value for key, value in self.filters.items())
            ]

            if self.order_column is not None:
                rows.sort(
                    key=lambda item: item.get(self.order_column, 0),
                    reverse=self.order_desc,
                )

            if self.limit_value is not None:
                rows = rows[: self.limit_value]

            return SimpleNamespace(data=rows)

        raise AssertionError(f"Unexpected table access: {self.name}")


class _LearningLoopFakeSupabase:
    def __init__(self):
        self.rpc_calls = []
        self.store = {
            "sessions": {},
            "transcripts": [],
            "salesperson_profiles": [],
        }

    def table(self, name):
        return _LearningLoopFakeTable(name, self.store)

    def rpc(self, name, params):
        return _LearningLoopFakeRpc(self, name, params)


class TwoCallLearningLoopRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_first_call_generates_profile_version_and_second_call_consumes_it(self):
        fake_supabase = _LearningLoopFakeSupabase()
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
        self.assertEqual(fake_supabase.rpc_calls[0][0], "create_salesperson_profile_version")
        self.assertEqual(fake_supabase.rpc_calls[0][1]["p_call_id"], first_session["id"])
        self.assertEqual(fake_supabase.rpc_calls[0][1]["p_weakest_dimension"], "objection_handling")


if __name__ == "__main__":
    unittest.main()
