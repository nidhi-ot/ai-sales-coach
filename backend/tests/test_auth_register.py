import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient
from supabase_auth.errors import AuthApiError

from app.main import app


class _FakeAdmin:
    def create_user(self, _payload):
        raise AuthApiError(
            "A user with this email address has already been registered",
            422,
            None,
        )


class _FakeAuth:
    admin = _FakeAdmin()


class _FakeSupabase:
    auth = _FakeAuth()


class _FakeTable:
    def __init__(self, rows):
        self.rows = rows

    def select(self, _columns):
        return self

    def eq(self, column, value):
        self.rows = [row for row in self.rows if row.get(column) == value]
        return self

    def limit(self, _count):
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


class _FakeLoginSupabase:
    auth = _FakeAuth()

    def table(self, name):
        if name != "salesperson_accounts":
            raise AssertionError(f"Unexpected table: {name}")

        return _FakeTable(
            [
                {
                    "id": "rep-456",
                    "full_name": "Test Rep",
                    "phone_number": "0700000000",
                    "business_id": "business-789",
                    "role": "rep",
                }
            ]
        )


class _FakeSignInAuth:
    def sign_in_with_password(self, payload):
        assert payload == {
            "email": "rep@example.com",
            "password": "Test12345!",
        }

        return SimpleNamespace(
            user=SimpleNamespace(id="rep-456", email="rep@example.com"),
            session=SimpleNamespace(access_token="test-access-token"),
        )


class _FakeAuthClient:
    auth = _FakeSignInAuth()


class RegisterRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_register_returns_conflict_for_existing_email(self):
        with patch("app.api.routes.auth.get_supabase", return_value=_FakeSupabase()):
            response = self.client.post(
                "/api/v1/auth/register",
                json={
                    "full_name": "Existing User",
                    "email": "existing@example.com",
                    "phone_number": "0700000000",
                    "password": "Test12345!",
                },
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json()["detail"],
            "A user with this email address has already been registered",
        )

    def test_login_returns_access_token_and_rep_context(self):
        with (
            patch(
                "app.api.routes.auth.get_supabase",
                return_value=_FakeLoginSupabase(),
            ),
            patch(
                "app.api.routes.auth.get_supabase_auth",
                return_value=_FakeAuthClient(),
            ),
        ):
            response = self.client.post(
                "/api/v1/auth/login",
                json={
                    "identifier": "rep@example.com",
                    "password": "Test12345!",
                },
            )
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(payload["message"], "Login successful")
        self.assertEqual(payload["user_id"], "rep-456")
        self.assertEqual(payload["rep_id"], "rep-456")
        self.assertEqual(payload["access_token"], "test-access-token")
        self.assertEqual(payload["email"], "rep@example.com")
        self.assertEqual(payload["full_name"], "Test Rep")
        self.assertEqual(payload["phone_number"], "0700000000")
        self.assertEqual(payload["business_id"], "business-789")
        self.assertEqual(payload["role"], "rep")


if __name__ == "__main__":
    unittest.main()
