import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

from app.api.deps import (
    CurrentAccount,
    ensure_business_access,
    get_current_account,
    require_role,
)


class _FakeAccountsTable:
    def __init__(self, rows):
        self.rows = rows
        self.filters = {}
        self.limit_value = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def execute(self):
        rows = [
            dict(row)
            for row in self.rows
            if all(row.get(key) == value for key, value in self.filters.items())
        ]

        if self.limit_value is not None:
            rows = rows[: self.limit_value]

        return SimpleNamespace(data=rows)


class _FakeSupabase:
    def __init__(self, rows):
        self.rows = rows

    def table(self, name):
        if name != "salesperson_accounts":
            raise AssertionError(f"Unexpected table: {name}")

        return _FakeAccountsTable(self.rows)


class AccountDependencyTests(unittest.IsolatedAsyncioTestCase):
    async def test_get_current_account_defaults_missing_role_to_rep(self):
        fake_supabase = _FakeSupabase(
            [
                {
                    "id": "rep-123",
                    "business_id": "business-123",
                }
            ]
        )

        with patch("app.api.deps.get_supabase", return_value=fake_supabase):
            account = await get_current_account(
                current_user=SimpleNamespace(id="rep-123"),
            )

        self.assertEqual(
            account,
            CurrentAccount(id="rep-123", role="rep", business_id="business-123"),
        )

    async def test_get_current_account_rejects_missing_business(self):
        fake_supabase = _FakeSupabase(
            [
                {
                    "id": "rep-123",
                    "role": "rep",
                }
            ]
        )

        with patch("app.api.deps.get_supabase", return_value=fake_supabase):
            with self.assertRaises(HTTPException) as ctx:
                await get_current_account(current_user=SimpleNamespace(id="rep-123"))

        self.assertEqual(ctx.exception.status_code, 403)

    async def test_get_current_account_rejects_missing_row(self):
        fake_supabase = _FakeSupabase([])

        with patch("app.api.deps.get_supabase", return_value=fake_supabase):
            with self.assertRaises(HTTPException) as ctx:
                await get_current_account(current_user=SimpleNamespace(id="rep-123"))

        self.assertEqual(ctx.exception.status_code, 403)

    async def test_require_role_allows_admin_and_matching_role(self):
        manager_dependency = require_role("manager")

        manager_account = CurrentAccount(
            id="manager-123",
            role="manager",
            business_id="business-123",
        )
        admin_account = CurrentAccount(
            id="admin-123",
            role="admin",
            business_id="business-123",
        )

        self.assertEqual(
            await manager_dependency(current_account=manager_account),
            manager_account,
        )
        self.assertEqual(
            await manager_dependency(current_account=admin_account),
            admin_account,
        )

    async def test_require_role_rejects_rep_for_manager_only_dependency(self):
        manager_dependency = require_role("manager")
        rep_account = CurrentAccount(
            id="rep-123",
            role="rep",
            business_id="business-123",
        )

        with self.assertRaises(HTTPException) as ctx:
            await manager_dependency(current_account=rep_account)

        self.assertEqual(ctx.exception.status_code, 403)

    def test_ensure_business_access_rejects_cross_business_access(self):
        with self.assertRaises(HTTPException) as ctx:
            ensure_business_access("business-a", "business-b")

        self.assertEqual(ctx.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
