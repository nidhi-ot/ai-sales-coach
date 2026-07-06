import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from app.config import settings
from app.db.client import get_supabase
from app.services.scorecards import SCORECARD_STATUS_PROCESSING, run_scorecard_pipeline

logger = logging.getLogger(__name__)


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


def _parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    else:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


async def sweep_expired_sessions_once(now: datetime | None = None) -> int:
    supabase = get_supabase()
    now_utc = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    max_elapsed = timedelta(seconds=settings.max_call_seconds + settings.max_call_grace_seconds)
    completed_count = 0

    active_sessions = _row_dicts(
        supabase.table("sessions")
        .select("id, started_at, status")
        .eq("status", "active")
        .execute()
        .data
    )

    for session in active_sessions:
        session_id = session.get("id")
        started_at = _parse_datetime(session.get("started_at"))
        if not session_id or not started_at:
            continue

        if now_utc - started_at < max_elapsed:
            continue

        ended_at = started_at + timedelta(seconds=settings.max_call_seconds)
        supabase.table("sessions").update(
            {
                "status": "completed",
                "ended_at": ended_at.isoformat(),
                "duration_seconds": settings.max_call_seconds,
            }
        ).eq("id", str(session_id)).execute()

        await run_scorecard_pipeline(str(session_id))
        completed_count += 1

    return completed_count


async def recover_stale_processing_scorecards_once(now: datetime | None = None) -> int:
    supabase = get_supabase()
    now_utc = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    stale_after = timedelta(seconds=max(settings.sweeper_interval_seconds * 2, 120))
    recovered_count = 0

    processing_scorecards = _row_dicts(
        supabase.table("scorecards")
        .select("session_id, status, processing_started_at, created_at")
        .eq("status", SCORECARD_STATUS_PROCESSING)
        .execute()
        .data
    )

    for scorecard in processing_scorecards:
        session_id = scorecard.get("session_id")
        processing_started_at = _parse_datetime(scorecard.get("processing_started_at"))
        if processing_started_at is None:
            processing_started_at = _parse_datetime(scorecard.get("created_at"))

        if not session_id:
            continue

        if processing_started_at is not None and now_utc - processing_started_at < stale_after:
            continue

        await run_scorecard_pipeline(str(session_id))
        recovered_count += 1

    return recovered_count


async def run_sweeper() -> None:
    while True:
        try:
            await sweep_expired_sessions_once()
            await recover_stale_processing_scorecards_once()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Session sweeper failed")

        await asyncio.sleep(settings.sweeper_interval_seconds)
