from datetime import UTC, datetime, timedelta
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.db.client import (
    check_supabase_connection,
    get_business_profile,
    get_latest_profile,
)
from app.db.client import create_session as create_db_session
from app.models.agent import ScenarioSlug
from app.services.context import assemble_call_context

router = APIRouter()


class VadConfig(BaseModel):
    threshold: float
    silence_duration_ms: int


class SessionConfig(BaseModel):
    scenario: ScenarioSlug
    rep_id: UUID
    business_id: UUID
    vad: VadConfig | None = None


class RealtimeSessionResponse(BaseModel):
    client_secret: str
    session_id: str
    openai_session_id: str
    expires_at: datetime
    model: str


class EphemeralTokenResponse(BaseModel):
    client_secret: str
    expires_at: datetime
    model: str


class SupabaseStatusResponse(BaseModel):
    status: str
    table: str
    row_count: int


# To create a realtime session for sales call practice
@router.post("/session", response_model=RealtimeSessionResponse)
async def create_realtime_session(config: SessionConfig):
    # Step 1: Pick the AI customer persona for the selected scenario.

    # Profile from database is not used now.
    rep_profile_latest = await get_latest_profile(str(config.rep_id))
    business_profile = await get_business_profile(str(config.business_id))

    # Print profiles for debugging
    print(f" Rep Profile (latest) : {rep_profile_latest}")
    print(f" Business Profile: {business_profile}")

    # Step 2: Assemble the system instruction for the OpenAI session, combining the scenario
    context = assemble_call_context(
        rep_profile=rep_profile_latest,
        business_profile=business_profile,
        scenario=config.scenario,
    )

    scenario_config = context["scenario"]
    print(f"\n📋 Scenario Selected: {scenario_config.title}")
    print(f"🎯 Objective: {scenario_config.objective}\n")

    instructions = context["system_instruction"]
    openai_api_key = settings.openai_api_key
    print(f"📋 System Instructions: \n {instructions}\n")

    if not openai_api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured",
        )

    profile_version = rep_profile_latest["version"] if rep_profile_latest else 0

    db_session = await create_db_session(
        rep_id=str(config.rep_id),
        business_id=str(config.business_id),
        scenario=config.scenario.value,
        profile_version=profile_version,
    )

    if not db_session:
        raise HTTPException(
            status_code=500,
            detail="Failed to create Supabase session",
        )

    # Store the database session ID separately from the OpenAI realtime session
    # ID. The database ID is used for transcripts and later session updates.
    supabase_session_id = db_session["id"]

    vad_threshold = config.vad.threshold if config.vad else 0.5
    vad_silence_duration_ms = config.vad.silence_duration_ms if config.vad else 500

    print(
        f"🎙️ VAD config: threshold={vad_threshold}, "
        f"silence_duration_ms={vad_silence_duration_ms}"
    )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/realtime/client_secrets",
                headers={
                    "Authorization": f"Bearer {openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "session": {
                        "type": "realtime",
                        "model": "gpt-realtime-2",
                        "audio": {
                            "input": {
                                "transcription": {
                                    "model": "whisper-1",
                                },
                                "turn_detection": {
                                    "type": "server_vad",
                                    "threshold": vad_threshold,
                                    "silence_duration_ms": vad_silence_duration_ms,
                                },
                            },
                            "output": {
                                "voice": "marin",
                            },
                        },
                        "instructions": instructions,
                    },
                },
                timeout=10.0,
            )

            if not response.is_success:
                raise HTTPException(
                    status_code=502,
                    detail=f"OpenAI session creation failed: {response.text}",
                )

            data = response.json()
            client_secret = data.get("value")
            openai_session_id = data.get("session", {}).get("id")

            if not client_secret or not openai_session_id:
                raise HTTPException(
                    status_code=502,
                    detail="OpenAI response did not include session credentials",
                )

            return RealtimeSessionResponse(
                client_secret=client_secret,
                session_id=supabase_session_id,
                openai_session_id=openai_session_id,
                expires_at=datetime.now(UTC) + timedelta(minutes=5),
                model="gpt-realtime-2",
            )

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(exc)}",
        )


@router.get("/status")
async def realtime_status():
    return {"status": "ok"}


# For short-lived token to keep the OpenAI key secure
@router.post("/token", response_model=EphemeralTokenResponse)
async def create_ephemeral_token():
    openai_api_key = settings.openai_api_key

    if not openai_api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured",
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/realtime/sessions",
                headers={
                    "Authorization": f"Bearer {openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-realtime-2",
                    "voice": "alloy",
                    "modalities": ["text", "audio"],
                    "instructions": "You are a helpful assistant.",
                },
                timeout=10.0,
            )

            response.raise_for_status()
            data = response.json()

            return EphemeralTokenResponse(
                client_secret=data["client_secret"]["value"],
                expires_at=datetime.now(UTC) + timedelta(minutes=5),
                model="gpt-realtime-2",
            )

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(exc)}",
        )


# To check supabase connectivity
@router.get("/supabase-status", response_model=SupabaseStatusResponse)
async def supabase_status():
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase environment variables are not configured",
        )

    try:
        result = await check_supabase_connection()
        return SupabaseStatusResponse(**result)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Supabase connection error: {str(exc)}",
        )
