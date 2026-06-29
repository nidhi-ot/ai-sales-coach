import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services.session_analytics import create_next_salesperson_profile


class _FakeTable:
    def __init__(self, name, store):
        self.name = name
        self.store = store
        self.filters = {}

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def limit(self, _value):
        return self

    def execute(self):
        if self.name == "sessions":
            session = self.store["sessions"].get(self.filters.get("id"))
            return SimpleNamespace(data=[dict(session)] if session else [])

        if self.name == "salesperson_profiles":
            rows = [
                dict(profile)
                for profile in self.store["salesperson_profiles"]
                if all(profile.get(key) == value for key, value in self.filters.items())
            ]
            return SimpleNamespace(data=rows)

        raise AssertionError(f"Unexpected table access: {self.name}")


class _FakeRpc:
    def __init__(self, supabase, name, params):
        self.supabase = supabase
        self.name = name
        self.params = params

    def execute(self):
        self.supabase.rpc_calls.append((self.name, self.params))
        return SimpleNamespace(
            data={
                "id": "profile-2",
                "rep_id": self.params["p_rep_id"],
                "business_id": self.params["p_business_id"],
                "version": 2,
                "call_id": self.params["p_call_id"],
                "metric_scores": self.params["p_metric_scores"],
                "weakest_dimension": self.params["p_weakest_dimension"],
            }
        )


class _FakeSupabase:
    def __init__(self):
        self.rpc_calls = []
        self.store = {
            "sessions": {
                "session-123": {
                    "id": "session-123",
                    "rep_id": "rep-456",
                    "business_id": "business-789",
                }
            },
            "salesperson_profiles": [],
        }

    def table(self, name):
        return _FakeTable(name, self.store)

    def rpc(self, name, params):
        return _FakeRpc(self, name, params)


class CreateNextSalespersonProfileTests(unittest.IsolatedAsyncioTestCase):
    async def test_uses_database_rpc_to_allocate_next_profile_version(self):
        fake_supabase = _FakeSupabase()
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

        self.assertEqual(
            fake_supabase.rpc_calls,
            [
                (
                    "create_salesperson_profile_version",
                    {
                        "p_rep_id": "rep-456",
                        "p_business_id": "business-789",
                        "p_call_id": "session-123",
                        "p_metric_scores": {
                            "rapport": 8,
                            "discovery": 6,
                            "objection_handling": 4,
                            "closing": 7,
                        },
                        "p_weakest_dimension": "objection_handling",
                    },
                )
            ],
        )
        self.assertEqual(profile["version"], 2)


if __name__ == "__main__":
    unittest.main()
