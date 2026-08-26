import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from tests.helpers import FakeSupabase


class RealtimeRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.rep_id = "11111111-1111-1111-1111-111111111111"
        self.business_id = "22222222-2222-2222-2222-222222222222"
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=self.rep_id)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_realtime_session_passes_recent_history_to_context(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["salesperson_accounts"].append(
            {
                "id": self.rep_id,
                "business_id": self.business_id,
                "role": "rep",
                "is_active": True,
            }
        )

        recent_history = [
            {
                "session_id": "session-old",
                "transcript": [{"speaker": "rep", "text": "I pitched too early."}],
            }
        ]
        captured_context = {}

        def fake_assemble_call_context(**kwargs):
            captured_context.update(kwargs)
            return {
                "framework": "BANT",
                "language": "en",
                "system_instruction": "Base instruction",
            }

        class FakeResponse:
            is_success = True

            def json(self):
                return {
                    "value": "client-secret",
                    "session": {"id": "openai-session-123"},
                }

        class FakeAsyncClient:
            async def __aenter__(self):
                return self

            async def __aexit__(self, *_args):
                return False

            async def post(self, *_args, **_kwargs):
                return FakeResponse()

        with (
            patch("app.api.routes.realtime.get_supabase", return_value=fake_supabase),
            patch(
                "app.api.routes.realtime.get_recent_learning_history",
                return_value=recent_history,
            ) as history_mock,
            patch(
                "app.api.routes.realtime.assemble_call_context",
                side_effect=fake_assemble_call_context,
            ),
            patch("app.api.routes.realtime.build_learning_profile_instruction", return_value=""),
            patch("app.api.routes.realtime.httpx.AsyncClient", FakeAsyncClient),
            patch("app.api.routes.realtime.settings.openai_api_key", "test-key"),
            patch("app.api.routes.realtime.get_latest_profile", new=AsyncMock(return_value=None)),
        ):
            response = self.client.post(
                "/api/v1/realtime/session",
                json={
                    "rep_id": self.rep_id,
                    "business_id": self.business_id,
                    "scenario": "cold_call",
                    "focus_area": "discovery",
                },
            )

        self.assertEqual(response.status_code, 200)
        history_mock.assert_called_once_with(
            rep_id=self.rep_id,
            business_id=self.business_id,
            limit=3,
        )
        self.assertEqual(captured_context["recent_learning_history"], recent_history)


if __name__ == "__main__":
    unittest.main()