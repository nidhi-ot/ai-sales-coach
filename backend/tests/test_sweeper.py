import unittest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from app.services.sweeper import (
    recover_stale_processing_scorecards_once,
    sweep_expired_sessions_once,
)
from tests.helpers import FakeSupabase


class SweeperTests(unittest.IsolatedAsyncioTestCase):
    async def test_expired_session_is_completed_and_pipeline_is_awaited(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["sessions"]["session-123"]["started_at"] = "2026-06-25T10:00:00+00:00"
        calls: list[str] = []

        async def mark_processing(session_id: str):
            calls.append(f"mark:{session_id}")
            return {"session_id": session_id, "status": "processing"}

        async def run_pipeline(session_id: str):
            calls.append(f"pipeline:{session_id}")
            return {"session_id": session_id}

        with (
            patch("app.services.sweeper.get_supabase", return_value=fake_supabase),
            patch(
                "app.services.sweeper.mark_scorecard_processing",
                new=AsyncMock(side_effect=mark_processing),
            ) as processing_mock,
            patch(
                "app.services.sweeper.run_scorecard_pipeline",
                new=AsyncMock(side_effect=run_pipeline),
            ) as pipeline_mock,
        ):
            completed = await sweep_expired_sessions_once(
                now=datetime(2026, 6, 25, 10, 11, 0, tzinfo=timezone.utc)
            )

        self.assertEqual(completed, 1)
        self.assertEqual(fake_supabase.store["sessions"]["session-123"]["status"], "completed")
        processing_mock.assert_awaited_once_with("session-123")
        pipeline_mock.assert_awaited_once_with("session-123")
        self.assertEqual(calls, ["mark:session-123", "pipeline:session-123"])

    async def test_stale_heartbeat_completes_abandoned_session_before_hard_timeout(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["sessions"]["session-123"]["started_at"] = "2026-06-25T10:00:00+00:00"
        fake_supabase.store["sessions"]["session-123"]["metadata"] = {
            "system_instruction": "Test scenario",
            "heartbeat_at": "2026-06-25T10:00:30+00:00",
        }

        with (
            patch("app.services.sweeper.get_supabase", return_value=fake_supabase),
            patch(
                "app.services.sweeper.mark_scorecard_processing",
                new=AsyncMock(return_value={"session_id": "session-123", "status": "processing"}),
            ) as processing_mock,
            patch(
                "app.services.sweeper.run_scorecard_pipeline",
                new=AsyncMock(return_value={"session_id": "session-123"}),
            ) as pipeline_mock,
        ):
            completed = await sweep_expired_sessions_once(
                now=datetime(2026, 6, 25, 10, 2, 5, tzinfo=timezone.utc)
            )

        self.assertEqual(completed, 1)
        session = fake_supabase.store["sessions"]["session-123"]
        self.assertEqual(session["status"], "completed")
        self.assertEqual(session["duration_seconds"], 120)
        self.assertEqual(session["ended_at"], "2026-06-25T10:02:00+00:00")
        processing_mock.assert_awaited_once_with("session-123")
        pipeline_mock.assert_awaited_once_with("session-123")

    async def test_stale_processing_scorecard_is_recovered(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-123",
                "rep_id": "rep-456",
                "business_id": "business-789",
                "status": "processing",
                "processing_started_at": "2026-06-25T10:00:00+00:00",
            }
        )

        with (
            patch("app.services.sweeper.get_supabase", return_value=fake_supabase),
            patch(
                "app.services.sweeper.run_scorecard_pipeline",
                new=AsyncMock(return_value={"session_id": "session-123"}),
            ) as pipeline_mock,
        ):
            recovered = await recover_stale_processing_scorecards_once(
                now=datetime(2026, 6, 25, 10, 3, 0, tzinfo=timezone.utc)
            )

        self.assertEqual(recovered, 1)
        pipeline_mock.assert_awaited_once_with("session-123")

    async def test_fresh_processing_scorecard_is_not_recovered(self):
        fake_supabase = FakeSupabase()
        fake_supabase.store["scorecards"].append(
            {
                "id": "scorecard-1",
                "session_id": "session-123",
                "rep_id": "rep-456",
                "business_id": "business-789",
                "status": "processing",
                "processing_started_at": "2026-06-25T10:02:30+00:00",
            }
        )

        with (
            patch("app.services.sweeper.get_supabase", return_value=fake_supabase),
            patch("app.services.sweeper.run_scorecard_pipeline", new=AsyncMock()) as pipeline_mock,
        ):
            recovered = await recover_stale_processing_scorecards_once(
                now=datetime(2026, 6, 25, 10, 3, 0, tzinfo=timezone.utc)
            )

        self.assertEqual(recovered, 0)
        pipeline_mock.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
