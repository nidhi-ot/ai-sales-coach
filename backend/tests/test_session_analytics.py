import unittest
from unittest.mock import patch

from app.services.session_analytics import create_next_salesperson_profile
from tests.helpers import FakeSupabase


class CreateNextSalespersonProfileTests(unittest.IsolatedAsyncioTestCase):
    async def test_creates_next_profile_version_with_table_insert(self):
        fake_supabase = FakeSupabase()
        scorecard = {
            "rapport_score": 8,
            "needs_discovery_score": 6,
            "objection_handling_score": 4,
            "closing_score": 7,
        }

        with patch(
            "app.services.session_analytics.get_supabase",
            return_value=fake_supabase,
        ):
            profile = await create_next_salesperson_profile("session-123", scorecard)

        self.assertEqual(fake_supabase.rpc_calls, [])
        self.assertEqual(len(fake_supabase.store["salesperson_profiles"]), 1)

        created = fake_supabase.store["salesperson_profiles"][0]
        self.assertEqual(profile["id"], created["id"])
        self.assertEqual(created["rep_id"], "rep-456")
        self.assertEqual(created["business_id"], "business-789")
        self.assertEqual(created["call_id"], "session-123")
        self.assertEqual(created["version"], 1)
        self.assertEqual(created["weakest_dimension"], "objection_handling")
        self.assertEqual(
            created["metric_scores"],
            {
                "rapport": 8,
                "discovery": 6,
                "objection_handling": 4,
                "closing": 7,
            },
        )

    async def test_allocates_version_after_existing_profile(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["salesperson_profiles"].append(
            {
                "id": "profile-1",
                "rep_id": "rep-456",
                "business_id": "business-789",
                "version": 1,
                "call_id": "old-session",
                "metric_scores": {},
                "weakest_dimension": "rapport",
            }
        )
        scorecard = {
            "rapport_score": 8,
            "needs_discovery_score": 6,
            "objection_handling_score": 4,
            "closing_score": 7,
        }

        with patch(
            "app.services.session_analytics.get_supabase",
            return_value=fake_supabase,
        ):
            profile = await create_next_salesperson_profile("session-123", scorecard)

        self.assertEqual(profile["version"], 2)
        self.assertEqual(len(fake_supabase.store["salesperson_profiles"]), 2)

    async def test_allocates_version_within_session_business(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["salesperson_profiles"].append(
            {
                "id": "profile-other-business",
                "rep_id": "rep-456",
                "business_id": "business-other",
                "version": 9,
                "call_id": "old-session",
                "metric_scores": {},
                "weakest_dimension": "rapport",
            }
        )
        scorecard = {
            "rapport_score": 8,
            "needs_discovery_score": 6,
            "objection_handling_score": 4,
            "closing_score": 7,
        }

        with patch(
            "app.services.session_analytics.get_supabase",
            return_value=fake_supabase,
        ):
            profile = await create_next_salesperson_profile("session-123", scorecard)

        self.assertEqual(profile["business_id"], "business-789")
        self.assertEqual(profile["version"], 1)
        self.assertEqual(len(fake_supabase.store["salesperson_profiles"]), 2)


if __name__ == "__main__":
    unittest.main()
