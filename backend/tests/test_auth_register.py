import unittest
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


if __name__ == "__main__":
    unittest.main()
