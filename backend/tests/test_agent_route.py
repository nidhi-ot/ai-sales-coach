import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.api.deps import CurrentAccount, get_current_account
from app.main import app


class AgentRouteSecurityTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.rep_id = "11111111-1111-1111-1111-111111111111"
        self.account_business_id = "22222222-2222-2222-2222-222222222222"
        app.dependency_overrides[get_current_account] = lambda: CurrentAccount(
            id=self.rep_id,
            role="rep",
            business_id=self.account_business_id,
        )

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_before_call_rejects_request_business_outside_account(self):
        with (
            patch("app.api.routes.agent.get_latest_profile", new=AsyncMock()) as profile_mock,
            patch("app.api.routes.agent.get_business_profile", new=AsyncMock()) as business_mock,
        ):
            response = self.client.post(
                "/api/v1/agent/before-call",
                json={
                    "rep_id": self.rep_id,
                    "business_id": "33333333-3333-3333-3333-333333333333",
                    "scenario": "cold_call",
                },
            )

        self.assertEqual(response.status_code, 403)
        profile_mock.assert_not_awaited()
        business_mock.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
