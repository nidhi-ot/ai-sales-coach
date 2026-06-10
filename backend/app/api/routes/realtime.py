from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings

router = APIRouter()


class EphemeralTokenResponse(BaseModel):
    client_secret: str
    expires_at: datetime
    model: str


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