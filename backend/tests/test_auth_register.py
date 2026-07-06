import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient
from supabase_auth.errors import AuthApiError

from app.main import app
from tests.helpers import FakeSupabase


class _CreateUserAdmin:
    def __init__(self, user_id: str = "rep-456", email: str = "rep@example.com"):
        self.user_id = user_id
        self.email = email

    def create_user(self, payload):
        return SimpleNamespace(
            user=SimpleNamespace(id=self.user_id, email=payload["email"]),
        )

    def get_user_by_id(self, user_id):  # pragma: no cover - login-only fallback
        return SimpleNamespace(
            user=SimpleNamespace(id=user_id, email=self.email),
        )


class _ConflictAdmin:
    def create_user(self, _payload):
        raise AuthApiError(
            "A user with this email address has already been registered",
            422,
            None,
        )


class _SignInAuth:
    def sign_in_with_password(self, payload):
        assert payload == {
            "email": "rep@example.com",
            "password": "Test12345!",
        }

        return SimpleNamespace(
            user=SimpleNamespace(id="rep-456", email="rep@example.com"),
            session=SimpleNamespace(access_token="test-access-token"),
        )


class _AuthClient:
    auth = _SignInAuth()


class _LoginAdmin:
    def get_user_by_id(self, user_id):
        return SimpleNamespace(user=SimpleNamespace(id=user_id, email="rep@example.com"))


class _LoginSupabase:
    auth = SimpleNamespace(admin=_LoginAdmin())

    class _Table:
        def select(self, _columns):
            return self

        def eq(self, _column, _value):
            return self

        def limit(self, _count):
            return self

        def execute(self):
            return SimpleNamespace(
                data=[
                    {
                        "id": "rep-456",
                        "full_name": "Test Rep",
                        "email": "rep@example.com",
                        "phone_number": "0700000000",
                        "employee_id": "EMP-123",
                        "business_id": "business-789",
                        "role": "rep",
                    }
                ]
            )

    def table(self, name):
        if name != "salesperson_accounts":
            raise AssertionError(f"Unexpected table: {name}")

        return self._Table()


class _RegisterSupabase(FakeSupabase):
    def __init__(self, *, user_id: str = "rep-456"):
        super().__init__(with_default_session=False)
        self.auth = SimpleNamespace(admin=_CreateUserAdmin(user_id=user_id))


class _InviteSupabase(FakeSupabase):
    def __init__(self):
        super().__init__(with_default_session=False)
        self.auth = SimpleNamespace(admin=_CreateUserAdmin())
        self.store["business_profiles"].append(
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
        self.store["salesperson_accounts"].append(
            {
                "id": "admin-123",
                "full_name": "Test Admin",
                "phone_number": "0700000002",
                "business_id": "business-789",
                "role": "admin",
            }
        )
        self.store["invites"].append(
            {
                "id": "invite-123",
                "email": "invitee@example.com",
                "business_id": "business-789",
                "role": "manager",
                "token": "invite-token-123",
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                "used_at": None,
            }
        )


class RegisterRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_register_returns_conflict_for_existing_email(self):
        with (
            patch("app.api.routes.auth.settings.allow_open_signup", True),
            patch("app.api.routes.auth.get_supabase", return_value=_ConflictSupabase()),
        ):
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

    def test_register_rejects_missing_invite_when_open_signup_disabled(self):
        with (
            patch("app.api.routes.auth.settings.allow_open_signup", False),
            patch("app.api.routes.auth.get_supabase", return_value=_RegisterSupabase()),
        ):
            response = self.client.post(
                "/api/v1/auth/register",
                json={
                    "full_name": "New User",
                    "email": "new@example.com",
                    "phone_number": "0700000000",
                    "password": "Test12345!",
                },
            )

        self.assertEqual(response.status_code, 403)
        self.assertIn("invite token", response.json()["detail"].lower())

    def test_register_with_valid_invite_uses_invite_context(self):
        fake_supabase = _InviteSupabase()

        with (
            patch("app.api.routes.auth.settings.allow_open_signup", False),
            patch("app.api.routes.auth.get_supabase", return_value=fake_supabase),
        ):
            response = self.client.post(
                "/api/v1/auth/register",
                json={
                    "full_name": "Invite User",
                    "email": "invitee@example.com",
                    "phone_number": "0700000009",
                    "password": "Test12345!",
                    "invite_token": "invite-token-123",
                    "employee_id": "EMP-999",
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["business_id"], "business-789")
        self.assertEqual(payload["role"], "manager")
        self.assertEqual(payload["employee_id"], "EMP-999")
        self.assertEqual(payload["rep_id"], "rep-456")
        self.assertEqual(fake_supabase.store["invites"][0]["used_at"] is not None, True)
        created_account = fake_supabase.store["salesperson_accounts"][-1]
        self.assertEqual(created_account["employee_id"], "EMP-999")
        self.assertEqual(created_account["business_id"], "business-789")
        self.assertEqual(created_account["role"], "manager")

    def test_login_returns_access_token_and_rep_context(self):
        with (
            patch("app.api.routes.auth.get_supabase", return_value=_LoginSupabase()),
            patch("app.api.routes.auth.get_supabase_auth", return_value=_AuthClient()),
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
        self.assertEqual(payload["employee_id"], "EMP-123")
        self.assertEqual(payload["phone_number"], "0700000000")
        self.assertEqual(payload["business_id"], "business-789")
        self.assertEqual(payload["role"], "rep")


class _ConflictSupabase:
    auth = SimpleNamespace(admin=_ConflictAdmin())


if __name__ == "__main__":
    unittest.main()
