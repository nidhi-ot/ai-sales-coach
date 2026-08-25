import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from tests.helpers import FakeSupabase


class ManagerRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def _set_current_user(self, user_id: str) -> None:
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=user_id)

    def _make_fake_supabase(self, business_ids: list[str]) -> FakeSupabase:
        fake_supabase = FakeSupabase(with_default_session=False)
        fake_supabase.store["business_profiles"].extend(
            {
                "id": business_id,
                "name": f"Business {business_id}",
                "framework": "BANT",
                "context_data": {},
                "products": "AI sales coach",
                "icp": "Sales teams",
                "objections": "",
                "language": "en",
            }
            for business_id in business_ids
        )
        return fake_supabase

    def test_rep_is_blocked_from_manager_route(self):
        fake_supabase = self._make_fake_supabase(["business-789"])
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": "rep-123",
                "full_name": "Test Rep",
                "phone_number": "0700000000",
                "business_id": "business-789",
                "role": "rep",
            }
        )
        self._set_current_user("rep-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.manager.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.get("/api/v1/manager/business/business-789/team")

        self.assertEqual(response.status_code, 403)

    def test_manager_cannot_read_a_different_business(self):
        fake_supabase = self._make_fake_supabase(["business-x", "business-y"])
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": "manager-123",
                "full_name": "Test Manager",
                "phone_number": "0700000001",
                "business_id": "business-x",
                "role": "manager",
            }
        )
        self._set_current_user("manager-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.manager.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.get("/api/v1/manager/business/business-y/team")

        self.assertEqual(response.status_code, 403)

    def test_manager_can_read_own_business_team(self):
        fake_supabase = self._make_fake_supabase(["business-789"])
        fake_supabase.store["salesperson_accounts"].extend(
            [
                {
                    "id": "manager-123",
                    "full_name": "Test Manager",
                    "phone_number": "0700000001",
                    "business_id": "business-789",
                    "role": "manager",
                },
                {
                    "id": "rep-123",
                    "full_name": "Test Rep",
                    "phone_number": "0700000000",
                    "business_id": "business-789",
                    "role": "rep",
                },
            ]
        )
        self._set_current_user("manager-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.manager.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.get("/api/v1/manager/business/business-789/team")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["business"]["id"], "business-789")
        self.assertEqual(payload["rep_count"], 1)
        self.assertEqual(len(payload["reps"]), 1)
        self.assertEqual(payload["reps"][0]["role"], "rep")

    def test_admin_can_access_a_different_business(self):
        fake_supabase = self._make_fake_supabase(["business-x", "business-y"])
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": "admin-123",
                "full_name": "Test Admin",
                "phone_number": "0700000002",
                "business_id": "business-x",
                "role": "admin",
            }
        )
        fake_supabase.store["salesperson_accounts"].extend(
            [
                {
                    "id": "rep-999",
                    "full_name": "Other Rep",
                    "phone_number": "0700000999",
                    "business_id": "business-y",
                    "role": "rep",
                },
                {
                    "id": "manager-999",
                    "full_name": "Other Manager",
                    "phone_number": "0700000998",
                    "business_id": "business-y",
                    "role": "manager",
                },
            ]
        )
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.manager.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.get("/api/v1/manager/business/business-y/team")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["business"]["id"], "business-y")
        self.assertEqual(payload["rep_count"], 1)
        self.assertEqual(len(payload["reps"]), 1)
        self.assertEqual(payload["reps"][0]["id"], "rep-999")

    def test_manager_only_sees_scorecards_shared_by_the_rep(self):
        fake_supabase = self._make_fake_supabase(["business-789"])
        fake_supabase.store["salesperson_accounts"].extend(
            [
                {
                    "id": "manager-123",
                    "full_name": "Test Manager",
                    "phone_number": "0700000001",
                    "business_id": "business-789",
                    "role": "manager",
                },
                {
                    "id": "rep-123",
                    "full_name": "Test Rep",
                    "phone_number": "0700000000",
                    "business_id": "business-789",
                    "role": "rep",
                },
            ]
        )
        fake_supabase.store["scorecards"].extend(
            [
                {
                    "id": "scorecard-shared",
                    "session_id": "session-shared",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "shared_with_manager": True,
                },
                {
                    "id": "scorecard-private",
                    "session_id": "session-private",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "shared_with_manager": False,
                },
            ]
        )
        self._set_current_user("manager-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.manager.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.get("/api/v1/manager/reps/rep-123/scorecards")

        self.assertEqual(response.status_code, 200)
        scorecards = response.json()["scorecards"]
        self.assertEqual(len(scorecards), 1)
        self.assertEqual(scorecards[0]["id"], "scorecard-shared")

    def test_manager_only_sees_sessions_with_shared_scorecards(self):
        fake_supabase = self._make_fake_supabase(["business-789"])
        fake_supabase.store["salesperson_accounts"].extend(
            [
                {
                    "id": "manager-123",
                    "full_name": "Test Manager",
                    "phone_number": "0700000001",
                    "business_id": "business-789",
                    "role": "manager",
                },
                {
                    "id": "rep-123",
                    "full_name": "Test Rep",
                    "phone_number": "0700000000",
                    "business_id": "business-789",
                    "role": "rep",
                },
            ]
        )

        fake_supabase.store["sessions"].update(
            {
                "session-shared": {
                    "id": "session-shared",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "scenario": "cold_call",
                    "started_at": "2026-08-10T10:00:00Z",
                    "ended_at": "2026-08-10T10:05:00Z",
                    "duration_seconds": 300,
                    "status": "completed",
                },
                "session-private": {
                    "id": "session-private",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "scenario": "objection_handling",
                    "started_at": "2026-08-11T10:00:00Z",
                    "ended_at": "2026-08-11T10:05:00Z",
                    "duration_seconds": 300,
                    "status": "completed",
                },
            }
        )
        fake_supabase.store["scorecards"].extend(
            [
                {
                    "id": "scorecard-shared",
                    "session_id": "session-shared",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "shared_with_manager": True,
                },
                {
                    "id": "scorecard-private",
                    "session_id": "session-private",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "shared_with_manager": False,
                },
            ]
        )
        self._set_current_user("manager-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.manager.get_supabase", return_value=fake_supabase),
        ):
            rep_scoped = self.client.get("/api/v1/manager/reps/rep-123/sessions")
            business_scoped = self.client.get(
                "/api/v1/manager/business/business-789/reps/rep-123/sessions"
            )

        for response in (rep_scoped, business_scoped):
            self.assertEqual(response.status_code, 200)
            sessions = response.json()["sessions"]
            self.assertEqual(len(sessions), 1)
            self.assertEqual(sessions[0]["id"], "session-shared")

    def test_manager_team_progress_only_uses_shared_scorecards(self):
        fake_supabase = self._make_fake_supabase(["business-789"])
        fake_supabase.store["salesperson_accounts"].extend(
            [
                {
                    "id": "manager-123",
                    "full_name": "Test Manager",
                    "phone_number": "0700000001",
                    "business_id": "business-789",
                    "role": "manager",
                },
                {
                    "id": "rep-123",
                    "full_name": "Test Rep",
                    "phone_number": "0700000000",
                    "business_id": "business-789",
                    "role": "rep",
                },
            ]
        )
        fake_supabase.store["scorecards"].extend(
            [
                {
                    "id": "scorecard-shared",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "shared_with_manager": True,
                    "rapport_score": 10,
                    "needs_discovery_score": 8,
                    "objection_handling_score": 6,
                    "closing_score": 4,
                },
                {
                    "id": "scorecard-private",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "shared_with_manager": False,
                    "rapport_score": 1,
                    "needs_discovery_score": 2,
                    "objection_handling_score": 3,
                    "closing_score": 4,
                },
            ]
        )
        self._set_current_user("manager-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.manager.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.get("/api/v1/manager/business/business-789/progress")

        self.assertEqual(response.status_code, 200)
        progress = response.json()["progress"]
        self.assertEqual(progress["rapport"], {"average": 10.0, "count": 1})
        self.assertEqual(progress["discovery"], {"average": 8.0, "count": 1})
        self.assertEqual(progress["objection_handling"], {"average": 6.0, "count": 1})
        self.assertEqual(progress["closing"], {"average": 4.0, "count": 1})

    def test_manager_team_overview_only_uses_shared_data(self):
        fake_supabase = self._make_fake_supabase(["business-789"])

        fake_supabase.store["salesperson_accounts"].extend(
            [
                {
                    "id": "manager-123",
                    "full_name": "Test Manager",
                    "phone_number": "0700000001",
                    "business_id": "business-789",
                    "role": "manager",
                },
                {
                    "id": "rep-123",
                    "full_name": "Test Rep",
                    "phone_number": "0700000000",
                    "business_id": "business-789",
                    "role": "rep",
                },
            ]
        )

        fake_supabase.store["sessions"].update(
            {
                "session-shared": {
                    "id": "session-shared",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "scenario": "cold_call",
                    "started_at": "2026-08-10T10:00:00Z",
                    "status": "completed",
                },
                "session-private": {
                    "id": "session-private",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "scenario": "objection_handling",
                    "started_at": "2026-08-11T10:00:00Z",
                    "status": "completed",
                },
            }
        )

        fake_supabase.store["scorecards"].extend(
            [
                {
                    "id": "scorecard-shared",
                    "session_id": "session-shared",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "shared_with_manager": True,
                    "overall_score": 8,
                    "rapport_score": 8,
                    "needs_discovery_score": 7,
                    "objection_handling_score": 6,
                    "closing_score": 5,
                },
                {
                    "id": "scorecard-private",
                    "session_id": "session-private",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "shared_with_manager": False,
                    "overall_score": 2,
                    "rapport_score": 1,
                    "needs_discovery_score": 2,
                    "objection_handling_score": 3,
                    "closing_score": 4,
                },
            ]
        )

        self._set_current_user("manager-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.manager.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.get(
                "/api/v1/manager/business/business-789/team"
            )

        self.assertEqual(response.status_code, 200)

        reps = response.json()["reps"]
        self.assertEqual(len(reps), 1)

        rep = reps[0]

        self.assertEqual(rep["sessions"], 1)
        self.assertEqual(rep["last_practice"], "2026-08-10T10:00:00Z")

    def test_manager_only_sees_transcripts_from_shared_sessions(self):
        fake_supabase = self._make_fake_supabase(["business-789"])
        fake_supabase.store["salesperson_accounts"].extend(
            [
                {
                    "id": "manager-123",
                    "full_name": "Test Manager",
                    "phone_number": "0700000001",
                    "business_id": "business-789",
                    "role": "manager",
                },
                {
                    "id": "rep-123",
                    "full_name": "Test Rep",
                    "phone_number": "0700000000",
                    "business_id": "business-789",
                    "role": "rep",
                },
            ]
        )
        fake_supabase.store["scorecards"].extend(
            [
                {
                    "id": "scorecard-shared",
                    "session_id": "session-shared",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "shared_with_manager": True,
                },
                {
                    "id": "scorecard-private",
                    "session_id": "session-private",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "shared_with_manager": False,
                },
            ]
        )
        fake_supabase.store["transcripts"].extend(
            [
                {
                    "id": "transcript-1",
                    "session_id": "session-shared",
                    "speaker": "rep",
                    "text": "Shared call line",
                    "timestamp_offset_ms": 1000,
                },
                {
                    "id": "transcript-2",
                    "session_id": "session-private",
                    "speaker": "rep",
                    "text": "Private call line",
                    "timestamp_offset_ms": 1000,
                },
            ]
        )
        self._set_current_user("manager-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.manager.get_supabase", return_value=fake_supabase),
        ):
            rep_scoped = self.client.get("/api/v1/manager/reps/rep-123/transcripts")
            business_scoped = self.client.get(
                "/api/v1/manager/business/business-789/reps/rep-123/transcripts"
            )

        for response in (rep_scoped, business_scoped):
            self.assertEqual(response.status_code, 200)
            transcripts = response.json()["transcripts"]
            self.assertEqual(len(transcripts), 1)
            self.assertEqual(transcripts[0]["session_id"], "session-shared")


if __name__ == "__main__":
    unittest.main()
