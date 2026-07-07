import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from tests.helpers import FakeSupabase


class AdminRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def _set_current_user(self, user_id: str) -> None:
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=user_id)

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
                json={"email": "invitee@example.com", "role": "rep", "expires_in_days": 7},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(
            payload["registration_link"].startswith("http://127.0.0.1:3000/register?invite=")
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
                json={"email": "invitee@example.com", "role": "rep", "expires_in_days": 0},
            )

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
