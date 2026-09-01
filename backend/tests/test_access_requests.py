import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.api.deps import CurrentAccount, get_current_account
from app.main import app
from tests.helpers import FakeSupabase


class AccessRequestRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.supabase = FakeSupabase(with_default_session=False)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_public_request_is_saved(self):
        with (
            patch(
                "app.api.routes.access_requests.get_supabase",
                return_value=self.supabase,
            ),
            patch(
                "app.api.routes.access_requests._try_send_notification",
                new=AsyncMock(return_value=False),
            ),
        ):
            response = self.client.post(
                "/api/v1/access-requests",
                json={
                    "name": "New User",
                    "email": "USER@example.com",
                    "company": "Example AB",
                    "message": "Please give our team access.",
                },
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["email"], "user@example.com")
        self.assertEqual(response.json()["status"], "new")
        self.assertEqual(len(self.supabase.store["access_requests"]), 1)

    def test_invalid_email_is_rejected(self):
        response = self.client.post(
            "/api/v1/access-requests",
            json={
                "name": "New User",
                "email": "not-an-email",
                "message": "Please give our team access.",
            },
        )
        self.assertEqual(response.status_code, 422)

    def test_admin_can_list_and_update_requests(self):
        self.supabase.store["access_requests"].append(
            {
                "id": "request-1",
                "name": "New User",
                "email": "user@example.com",
                "company": None,
                "message": "Please give me access.",
                "status": "new",
                "created_at": "2026-09-01T10:00:00+00:00",
                "reviewed_at": None,
            }
        )
        app.dependency_overrides[get_current_account] = lambda: CurrentAccount(
            id="admin-1",
            role="admin",
            business_id="00000000-0000-0000-0000-000000000001",
        )

        with patch(
            "app.api.routes.access_requests.get_supabase",
            return_value=self.supabase,
        ):
            list_response = self.client.get("/api/v1/access-requests")
            update_response = self.client.patch(
                "/api/v1/access-requests/request-1",
                json={"status": "reviewed"},
            )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()["status"], "reviewed")
        self.assertIsNotNone(update_response.json()["reviewed_at"])

    def test_non_admin_cannot_list_requests(self):
        app.dependency_overrides[get_current_account] = lambda: CurrentAccount(
            id="rep-1",
            role="rep",
            business_id="00000000-0000-0000-0000-000000000001",
        )
        response = self.client.get("/api/v1/access-requests")
        self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
