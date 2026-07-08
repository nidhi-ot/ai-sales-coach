import unittest
from unittest.mock import patch

from app.db.client import get_latest_profile
from tests.helpers import FakeSupabase


class DbClientProfileTests(unittest.IsolatedAsyncioTestCase):
    async def test_get_latest_profile_filters_by_rep_and_business(self):
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
                },
                {
                    "id": "profile-target-business",
                    "rep_id": "rep-456",
                    "business_id": "business-789",
                    "version": 2,
                    "call_id": "target-session",
                    "metric_scores": {},
                    "weakest_dimension": "closing",
                },
            ]
        )

        with patch("app.db.client.get_supabase", return_value=fake_supabase):
            profile = await get_latest_profile("rep-456", "business-789")

        self.assertIsNotNone(profile)
        self.assertEqual(profile["id"], "profile-target-business")
        self.assertEqual(profile["business_id"], "business-789")


if __name__ == "__main__":
    unittest.main()
