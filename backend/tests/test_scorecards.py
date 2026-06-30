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
        self.in_filters = {}
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
    
    def in_(self, key, values):
        self.in_filters[key] = set(values)
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def order(self, column, *_args, **kwargs):
        self.order_column = column
        self.order_desc = bool(kwargs.get("desc", False))
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
    
    def _iter_rows(self):
        table = self.store[self.name]
        return table.values() if isinstance(table, dict) else table

    def _matches(self, row):
        return all(row.get(k) == v for k, v in self.filters.items()) and all(
            row.get(k) in values for k, values in self.in_filters.items()
        )

    def _selected_rows(self):
        rows = [dict(row) for row in self._iter_rows() if self._matches(row)]
        if self.order_column is not None:
            rows.sort(
                key=lambda row: "" if row.get(self.order_column) is None else row.get(self.order_column),
                reverse=self.order_desc,
            )
        if self.limit_value is not None:
            rows = rows[: self.limit_value]
        return rows

    def execute(self):
        if self.name == "sessions":
            if self.insert_payload is not None:
                row = {
                    "id": self.insert_payload.get("id") or f"session-{len(self.store['sessions']) + 1}",
                    **self.insert_payload,
                }
                self.store["sessions"][row["id"]] = row
                return SimpleNamespace(data=[dict(row)])

            if self.update_payload is not None:
                for session in self.store["sessions"].values():
                    if self._matches(session):
                        session.update(self.update_payload)

            return SimpleNamespace(data=self._selected_rows())


        if self.name == "transcripts":
            if self.insert_payload is not None:
                payload = self.insert_payload if isinstance(self.insert_payload, list) else [self.insert_payload]
                rows = []
                for item in payload:
                    row = {"id": f"transcript-{len(self.store['transcripts']) + 1}", **item}
                    self.store["transcripts"].append(row)
                    rows.append(dict(row))
                return SimpleNamespace(data=rows)

            return SimpleNamespace(data=self._selected_rows())

        if self.name == "scorecards":
            if self.insert_payload is not None:
                payload = dict(self.insert_payload)
                existing = next(
                    (
                        scorecard
                        for scorecard in self.store["scorecards"]
                        if scorecard.get("session_id") == payload.get("session_id")
                    ),
                    None,
                )
                if existing is not None:
                    existing.update(payload)
                    return SimpleNamespace(data=[dict(existing)])

                row = {
                    "id": payload.get("id") or f"scorecard-{len(self.store['scorecards']) + 1}",
                    "shared_with_manager": False,
                    **payload,
                }
                self.store["scorecards"].append(row)
                return SimpleNamespace(data=[dict(row)])

            if self.update_payload is not None:
                rows = []
                for scorecard in self.store["scorecards"]:
                    if self._matches(scorecard):
                        scorecard.update(self.update_payload)
                        rows.append(dict(scorecard))
                return SimpleNamespace(data=rows)

            return SimpleNamespace(data=self._selected_rows())

        

        if self.name == "salesperson_profiles":
            return SimpleNamespace(data=self._selected_rows())

        raise AssertionError(f"Unexpected table access: {self.name}")

class _FakeRpc:
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
        version = max((profile["version"] for profile in rep_profiles), default=0) + 1
        profile = {
            "id": f"profile-{version}",
            "rep_id": self.params["p_rep_id"],
            "business_id": self.params["p_business_id"],
            "version": version,
            "call_id": self.params["p_call_id"],
            "metric_scores": self.params["p_metric_scores"],
            "weakest_dimension": self.params["p_weakest_dimension"],
        }
        self.supabase.store["salesperson_profiles"].append(profile)
        return SimpleNamespace(data=profile)

class _FakeSupabase:
    def __init__(self):
        self.rpc_calls = []
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
            "salesperson_profiles": [],
        }

    def table(self, name):
        return _FakeTable(name, self.store)
    
    def rpc(self, name, params):
        return _FakeRpc(self, name, params)


class ScorecardRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_first_call_generates_profile_version_and_second_call_consumes_it(self):

        fake_supabase = _FakeSupabase()
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
                            "text": "Follow-up consistency.",
                            "timestamp_offset_ms": 2000,
                        },
                    ],
                },
            )
            self.assertEqual(first_end.status_code, 200)
            self.assertEqual(first_end.json()["profile"]["version"], 1)

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
        self.assertEqual(second_start.json()["profile_version"], 1)
        analyze_mock.assert_awaited_once_with(first_session["id"])

    def test_end_session_persists_generated_scorecard(self):
        fake_supabase = _FakeSupabase()
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
            patch("app.services.scorecards.gpt_analyze_transcript", new=AsyncMock(return_value=feedback)),
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
                        {"speaker": "rep", "text": "Tell me about the current process.", "timestamp_offset_ms": 1000},
                        {"speaker": "ai_customer", "text": "We lose track of follow-ups.", "timestamp_offset_ms": 2000},
                    ],
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["score_card_status"], "generated")
        self.assertEqual(len(fake_supabase.store["scorecards"]), 1)
        self.assertEqual(fake_supabase.store["scorecards"][0]["overall_score"], 8)

    def test_end_session_updates_existing_stub_scorecard_without_creating_duplicate(self):
        fake_supabase = _FakeSupabase()
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
            patch("app.services.scorecards.gpt_analyze_transcript", new=AsyncMock(return_value=feedback)),
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
                        {"speaker": "rep", "text": "Can we agree on a pilot?", "timestamp_offset_ms": 1000},
                        {"speaker": "ai_customer", "text": "Yes, send the next steps.", "timestamp_offset_ms": 2000},
                    ],
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(fake_supabase.store["scorecards"]), 1)
        self.assertEqual(fake_supabase.store["scorecards"][0]["id"], "scorecard-1")
        self.assertEqual(fake_supabase.store["scorecards"][0]["feedback_summary"], "Generated analysis.")
        self.assertTrue(fake_supabase.store["scorecards"][0]["shared_with_manager"])

    def test_history_returns_scorecard_fields_and_share_update_preserves_record(self):
        fake_supabase = _FakeSupabase()
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
        fake_supabase = _FakeSupabase()

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
