from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.services.scenarios import get_scenario_persona

router = APIRouter()

class SessionConfig(BaseModel):
    scenario: str
    rep_id: str
    business_id: str


class RealtimeSessionResponse(BaseModel):
    client_secret: str
    session_id: str
    expires_at: datetime
    model: str


class EphemeralTokenResponse(BaseModel):
    client_secret: str
    expires_at: datetime
    model: str


@router.post("/session", response_model=RealtimeSessionResponse)
async def create_realtime_session(config: SessionConfig):
    # Step 1: Pick the AI customer persona for the selected scenario.
    persona = get_scenario_persona(config.scenario)

    if persona is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario: {config.scenario}",
        )
    
    # Step 2: Read the OpenAI API key from backend settings.
    openai_api_key = settings.openai_api_key

    if not openai_api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured",
        )

    try:
        async with httpx.AsyncClient() as client:
            # Step 3: Ask OpenAI to create a realtime session.
            # The persona is sent as instructions so the AI knows how to act.
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
                                    "type": "semantic_vad",
                                },
                            },
                            "output": {
                                "voice": "alloy",
                            },
                        },
                        "instructions": persona,
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

            # Step 4: Read the temporary client secret from OpenAI's response.
            client_secret = data.get("value")
            openai_session_id = data.get("session", {}).get("id")
            
            if not client_secret or not openai_session_id:
                raise HTTPException(
                    status_code=502,
                    detail="OpenAI response did not include session credentials",
                )

            return RealtimeSessionResponse(
                client_secret=client_secret,
                session_id=openai_session_id,
                expires_at=datetime.utcnow() + timedelta(minutes=5),
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


@router.post("/token", response_model=EphemeralTokenResponse)
async def create_ephemeral_token():

    openai_api_key = settings.openai_api_key

    if not openai_api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured"
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
                    "instructions": "You are a helpful assistant."
                },
                timeout=10.0,
            )

            response.raise_for_status()

            data = response.json()

            return EphemeralTokenResponse(
                client_secret=data["client_secret"]["value"],
                expires_at=datetime.utcnow() + timedelta(minutes=5),
                model="gpt-realtime-2",
            )

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(exc)}"
        )
