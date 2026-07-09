import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.api.deps import CurrentAccount, get_current_account, get_current_user
from app.main import app
from tests.helpers import FakeSupabase


class AdminRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def _set_current_user(self, user_id: str) -> None:
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=user_id)

    def _set_current_account(self, account: CurrentAccount) -> None:
        app.dependency_overrides[get_current_account] = lambda: account

    def _make_member_supabase(self):
        fake_supabase = FakeSupabase(with_default_session=False)
        fake_supabase.store["business_profiles"].append(
            {
                "id": "business-789",
                "name": "Optimal Trappstadning",
                "framework": "BANT",
                "context_data": {},
                "products": "AI sales coaching",
                "icp": "Sales teams",
                "objections": "",
                "language": "en",
            }
        )
        fake_supabase.store["salesperson_accounts"].extend(
            [
                {
                    "id": "admin-123",
                    "full_name": "Test Admin",
                    "email": "admin@example.com",
                    "phone_number": "0700000002",
                    "employee_id": "EMP-ADMIN",
                    "business_id": "business-789",
                    "role": "admin",
                    "is_active": True,
                    "created_at": "2026-07-01T10:00:00+00:00",
                },
                {
                    "id": "manager-123",
                    "full_name": "Test Manager",
                    "email": "manager@example.com",
                    "phone_number": "0700000001",
                    "employee_id": "EMP-MANAGER",
                    "business_id": "business-789",
                    "role": "manager",
                    "is_active": True,
                    "created_at": "2026-07-02T10:00:00+00:00",
                },
                {
                    "id": "rep-123",
                    "full_name": "Test Rep",
                    "email": "rep@example.com",
                    "phone_number": "0700000000",
                    "employee_id": "EMP-REP",
                    "business_id": "business-789",
                    "role": "rep",
                    "is_active": True,
                    "created_at": "2026-07-03T10:00:00+00:00",
                },
            ]
        )
        return fake_supabase

    def test_admin_can_change_business_framework(self):
        fake_supabase = FakeSupabase(with_default_session=False)
        fake_supabase.store["business_profiles"].append(
            {
                "id": "business-789",
                "name": "Optimal Trappstadning",
                "framework": "BANT",
                "context_data": {},
                "products": "AI sales coaching",
                "icp": "Sales teams",
                "objections": "",
                "language": "en",
            }
        )
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": "admin-123",
                "full_name": "Test Admin",
                "phone_number": "0700000002",
                "business_id": "business-789",
                "role": "admin",
            }
        )
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.patch(
                "/api/v1/admin/business/framework",
                json={"framework": "MEDDIC"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["business_id"], "business-789")
        self.assertEqual(payload["framework"], "MEDDIC")
        self.assertIn("future sessions", payload["warning"])
        self.assertEqual(
            fake_supabase.store["business_profiles"][0]["framework"],
            "MEDDIC",
        )

    def test_manager_is_blocked_from_admin_framework_route(self):
        fake_supabase = FakeSupabase(with_default_session=False)
        fake_supabase.store["business_profiles"].append(
            {
                "id": "business-789",
                "name": "Optimal Trappstadning",
                "framework": "BANT",
                "context_data": {},
                "products": "AI sales coaching",
                "icp": "Sales teams",
                "objections": "",
                "language": "en",
            }
        )
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": "manager-123",
                "full_name": "Test Manager",
                "phone_number": "0700000001",
                "business_id": "business-789",
                "role": "manager",
            }
        )
        self._set_current_user("manager-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.patch(
                "/api/v1/admin/business/framework",
                json={"framework": "SPIN"},
            )

        self.assertEqual(response.status_code, 403)

    def test_invalid_framework_is_rejected(self):
        fake_supabase = FakeSupabase(with_default_session=False)
        fake_supabase.store["business_profiles"].append(
            {
                "id": "business-789",
                "name": "Optimal Trappstadning",
                "framework": "BANT",
                "context_data": {},
                "products": "AI sales coaching",
                "icp": "Sales teams",
                "objections": "",
                "language": "en",
            }
        )
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": "admin-123",
                "full_name": "Test Admin",
                "phone_number": "0700000002",
                "business_id": "business-789",
                "role": "admin",
            }
        )
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.patch(
                "/api/v1/admin/business/framework",
                json={"framework": "FOO"},
            )

        self.assertEqual(response.status_code, 422)

    def test_admin_invite_includes_frontend_origin(self):
        fake_supabase = FakeSupabase(with_default_session=False)
        fake_supabase.store["business_profiles"].append(
            {
                "id": "business-789",
                "name": "Optimal Trappstadning",
                "framework": "BANT",
                "context_data": {},
                "products": "AI sales coaching",
                "icp": "Sales teams",
                "objections": "",
                "language": "en",
            }
        )
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": "admin-123",
                "full_name": "Test Admin",
                "phone_number": "0700000002",
                "business_id": "business-789",
                "role": "admin",
            }
        )
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.post(
                "/api/v1/admin/invites",
                json={
                    "email": "invitee@example.com",
                    "role": "rep",
                    "expires_in_days": 7,
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(
            payload["registration_link"].startswith("http://localhost:3001/register?invite=")
        )

    def test_admin_invite_rejects_out_of_bounds_expiry(self):
        fake_supabase = FakeSupabase(with_default_session=False)
        fake_supabase.store["business_profiles"].append(
            {
                "id": "business-789",
                "name": "Optimal Trappstadning",
                "framework": "BANT",
                "context_data": {},
                "products": "AI sales coaching",
                "icp": "Sales teams",
                "objections": "",
                "language": "en",
            }
        )
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": "admin-123",
                "full_name": "Test Admin",
                "phone_number": "0700000002",
                "business_id": "business-789",
                "role": "admin",
            }
        )
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.post(
                "/api/v1/admin/invites",
                json={
                    "email": "invitee@example.com",
                    "role": "rep",
                    "expires_in_days": 0,
                },
            )

        self.assertEqual(response.status_code, 422)

    def test_admin_can_list_members(self):
        fake_supabase = self._make_member_supabase()
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.get("/api/v1/admin/members")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 3)
        self.assertEqual(payload[0]["id"], "rep-123")
        self.assertEqual(payload[0]["is_active"], True)
        self.assertEqual(payload[0]["role"], "rep")

    def test_admin_can_update_member_role(self):
        fake_supabase = self._make_member_supabase()
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.patch(
                "/api/v1/admin/members/rep-123",
                json={"role": "manager"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], "rep-123")
        self.assertEqual(payload["role"], "manager")
        self.assertEqual(
            fake_supabase.store["salesperson_accounts"][2]["role"],
            "manager",
        )

    def test_admin_can_deactivate_member(self):
        fake_supabase = self._make_member_supabase()
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.patch(
                "/api/v1/admin/members/manager-123",
                json={"is_active": False},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], "manager-123")
        self.assertEqual(payload["is_active"], False)
        self.assertEqual(
            fake_supabase.store["salesperson_accounts"][1]["is_active"],
            False,
        )

    def test_admin_update_uses_atomic_rpc(self):
        fake_supabase = self._make_member_supabase()
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.patch(
                "/api/v1/admin/members/rep-123",
                json={"role": "manager"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(fake_supabase.rpc_calls[0][0], "update_admin_member")
        self.assertEqual(
            fake_supabase.store["salesperson_accounts"][2]["role"],
            "manager",
        )

    def test_admin_can_export_member_data(self):
        fake_supabase = self._make_member_supabase()
        fake_supabase.store["salesperson_profiles"].extend(
            [
                {
                    "id": "profile-1",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "version": 1,
                    "call_id": "session-1",
                    "metric_scores": {"rapport": 7},
                    "weakest_dimension": "closing",
                },
                {
                    "id": "profile-2",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "version": 2,
                    "call_id": "session-2",
                    "metric_scores": {"rapport": 8},
                    "weakest_dimension": "discovery",
                },
            ]
        )
        fake_supabase.store["sessions"]["session-1"] = {
            "id": "session-1",
            "rep_id": "rep-123",
            "business_id": "business-789",
            "scenario": "cold_call",
            "started_at": "2026-07-01T10:00:00+00:00",
        }
        fake_supabase.store["sessions"]["session-2"] = {
            "id": "session-2",
            "rep_id": "rep-123",
            "business_id": "business-789",
            "scenario": "meeting",
            "started_at": "2026-07-02T10:00:00+00:00",
        }
        fake_supabase.store["transcripts"].extend(
            [
                {
                    "id": "transcript-1",
                    "session_id": "session-1",
                    "speaker": "rep",
                    "text": "Hello there",
                    "timestamp_offset_ms": 1000,
                    "created_at": "2026-07-01T10:00:01+00:00",
                },
                {
                    "id": "transcript-2",
                    "session_id": "session-2",
                    "speaker": "ai_customer",
                    "text": "Tell me more",
                    "timestamp_offset_ms": 2000,
                    "created_at": "2026-07-02T10:00:02+00:00",
                },
            ]
        )
        fake_supabase.store["scorecards"].extend(
            [
                {
                    "id": "scorecard-1",
                    "session_id": "session-1",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "overall_score": 8,
                    "created_at": "2026-07-01T10:05:00+00:00",
                },
                {
                    "id": "scorecard-2",
                    "session_id": "session-2",
                    "rep_id": "rep-123",
                    "business_id": "business-789",
                    "overall_score": 9,
                    "created_at": "2026-07-02T10:05:00+00:00",
                },
            ]
        )
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.get("/api/v1/admin/members/rep-123/export")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["account"]["id"], "rep-123")
        self.assertEqual(len(payload["sessions"]), 2)
        self.assertEqual(len(payload["transcripts"]), 2)
        self.assertEqual(len(payload["scorecards"]), 2)
        self.assertEqual(len(payload["profile_versions"]), 2)
        self.assertIn("Hello there", [item["text"] for item in payload["transcripts"]])

    def test_admin_can_delete_member_data(self):
        fake_supabase = self._make_member_supabase()
        fake_supabase.store["salesperson_profiles"].append(
            {
                "id": "profile-1",
                "rep_id": "rep-123",
                "business_id": "business-789",
                "version": 1,
                "call_id": "session-1",
                "metric_scores": {"rapport": 7},
                "weakest_dimension": "closing",
            }
        )
        fake_supabase.store["sessions"]["session-1"] = {
            "id": "session-1",
            "rep_id": "rep-123",
            "business_id": "business-789",
            "scenario": "cold_call",
        }
        fake_supabase.store["transcripts"].append(
            {
                "id": "transcript-1",
                "session_id": "session-1",
                "speaker": "rep",
                "text": "Hello there",
                "timestamp_offset_ms": 1000,
                "created_at": "2026-07-01T10:00:01+00:00",
            }
        )
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-1",
                "rep_id": "rep-123",
                "business_id": "business-789",
                "overall_score": 8,
            }
        )
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.delete("/api/v1/admin/members/rep-123")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Member deleted")
        self.assertEqual(fake_supabase.rpc_calls[0][0], "delete_member_data")
        self.assertEqual(fake_supabase.deleted_users, ["rep-123"])
        self.assertEqual(
            fake_supabase.store["salesperson_accounts"],
            [
                {
                    "id": "admin-123",
                    "full_name": "Test Admin",
                    "email": "admin@example.com",
                    "phone_number": "0700000002",
                    "employee_id": "EMP-ADMIN",
                    "business_id": "business-789",
                    "role": "admin",
                    "is_active": True,
                    "created_at": "2026-07-01T10:00:00+00:00",
                },
                {
                    "id": "manager-123",
                    "full_name": "Test Manager",
                    "email": "manager@example.com",
                    "phone_number": "0700000001",
                    "employee_id": "EMP-MANAGER",
                    "business_id": "business-789",
                    "role": "manager",
                    "is_active": True,
                    "created_at": "2026-07-02T10:00:00+00:00",
                },
            ],
        )
        self.assertEqual(fake_supabase.store["sessions"], {})
        self.assertEqual(fake_supabase.store["transcripts"], [])
        self.assertEqual(fake_supabase.store["scorecards"], [])
        self.assertEqual(fake_supabase.store["salesperson_profiles"], [])

    def test_admin_cannot_delete_self(self):
        fake_supabase = self._make_member_supabase()
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.delete("/api/v1/admin/members/admin-123")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"], "Cannot delete your own admin member record")
        self.assertEqual(fake_supabase.rpc_calls, [])
        self.assertEqual(fake_supabase.deleted_users, [])

    def test_admin_cannot_delete_last_active_admin(self):
        fake_supabase = FakeSupabase(with_default_session=False)
        fake_supabase.store["business_profiles"].append(
            {
                "id": "business-789",
                "name": "Optimal Trappstadning",
                "framework": "BANT",
                "context_data": {},
                "products": "AI sales coaching",
                "icp": "Sales teams",
                "objections": "",
                "language": "en",
            }
        )
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": "admin-target",
                "full_name": "Target Admin",
                "email": "admin-target@example.com",
                "phone_number": "0700000003",
                "employee_id": "EMP-TARGET",
                "business_id": "business-789",
                "role": "admin",
                "is_active": True,
                "created_at": "2026-07-03T10:00:00+00:00",
            }
        )
        self._set_current_account(
            CurrentAccount(
                id="admin-requester",
                role="admin",
                business_id="business-789",
            )
        )

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.delete("/api/v1/admin/members/admin-target")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json()["detail"],
            "Cannot delete the last active admin from the business",
        )
        self.assertEqual(fake_supabase.deleted_users, [])
        self.assertEqual(fake_supabase.store["salesperson_accounts"][0]["id"], "admin-target")

    def test_admin_cannot_update_cross_business_member(self):
        fake_supabase = self._make_member_supabase()
        fake_supabase.store["business_profiles"].append(
            {
                "id": "business-999",
                "name": "Other Company",
                "framework": "SPIN",
                "context_data": {},
                "products": "Other products",
                "icp": "Other teams",
                "objections": "",
                "language": "en",
            }
        )
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": "other-rep-123",
                "full_name": "Other Rep",
                "email": "other@example.com",
                "phone_number": "0700000099",
                "employee_id": "EMP-OTHER",
                "business_id": "business-999",
                "role": "rep",
                "is_active": True,
                "created_at": "2026-07-04T10:00:00+00:00",
            }
        )
        self._set_current_user("admin-123")

        with (
            patch("app.api.deps.get_supabase", return_value=fake_supabase),
            patch("app.api.routes.admin.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.patch(
                "/api/v1/admin/members/other-rep-123",
                json={"role": "manager"},
            )

        self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
