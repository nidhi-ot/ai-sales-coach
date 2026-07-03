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
        self.assertEqual(payload["rep_count"], 2)
        self.assertEqual(len(payload["reps"]), 2)

    def test_admin_can_access_manager_route(self):
        fake_supabase = self._make_fake_supabase(["business-789"])
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
            patch("app.api.routes.manager.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.get("/api/v1/manager/business/business-789/team")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["business"]["id"], "business-789")


if __name__ == "__main__":
    unittest.main()
