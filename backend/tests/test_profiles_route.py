import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.api.deps import CurrentAccount, get_current_account
from app.main import app
from tests.helpers import FakeSupabase


class ProfileRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides[get_current_account] = lambda: CurrentAccount(
            id="rep-456",
            role="rep",
            business_id="business-789",
        )

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_latest_profile_filters_by_account_business(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["salesperson_profiles"].extend(
            [
                {
                    "id": "profile-other-business",
                    "rep_id": "rep-456",
                    "business_id": "business-other",
                    "version": 9,
                    "call_id": "other-session",
                    "metric_scores": {},
                    "weakest_dimension": "rapport",
                    "created_at": "2026-06-25T10:00:00+00:00",
                },
                {
                    "id": "profile-target-business",
                    "rep_id": "rep-456",
                    "business_id": "business-789",
                    "version": 2,
                    "call_id": "target-session",
                    "metric_scores": {},
                    "weakest_dimension": "closing",
                    "created_at": "2026-06-25T11:00:00+00:00",
                },
            ]
        )

        with patch("app.api.routes.profiles.get_supabase", return_value=fake_supabase):
            response = self.client.get("/api/v1/profile/me/latest")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["version"], 2)
        self.assertEqual(payload["weakest_dimension"], "closing")


if __name__ == "__main__":
    unittest.main()
