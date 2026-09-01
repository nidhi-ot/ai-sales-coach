import asyncio
import logging
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.api.deps import CurrentAccount, require_role
from app.config import settings
from app.db.client import get_supabase

router = APIRouter()
logger = logging.getLogger(__name__)


def _row_dicts(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]


class CreateAccessRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    company: str | None = Field(default=None, max_length=160)
    message: str = Field(min_length=1, max_length=4000)
    website: str | None = Field(default=None, max_length=200)

    @field_validator("name", "email", "message")
    @classmethod
    def strip_required_fields(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be empty")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        local, separator, domain = value.rpartition("@")
        if not separator or not local or "." not in domain or domain.startswith("."):
            raise ValueError("Enter a valid email address")
        return value.lower()


class AccessRequestResponse(BaseModel):
    id: str
    name: str
    email: str
    company: str | None = None
    message: str
    status: Literal["new", "reviewed", "closed"]
    notification_sent: bool = False
    created_at: str | None = None
    reviewed_at: str | None = None


class UpdateAccessRequest(BaseModel):
    status: Literal["new", "reviewed", "closed"]


def _smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from_email)


def _send_notification_email(request: CreateAccessRequest) -> None:
    message = EmailMessage()
    message["Subject"] = "New AI Sales Coach access request"
    message["From"] = settings.smtp_from_email
    message["To"] = settings.access_request_recipient_email
    message["Reply-To"] = request.email
    message.set_content(
        "A new access request was submitted.\n\n"
        f"Name: {request.name}\n"
        f"Email: {request.email}\n"
        f"Company: {request.company or '-'}\n\n"
        f"Message:\n{request.message}\n"
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_username and settings.smtp_password:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)


async def _try_send_notification(request: CreateAccessRequest) -> bool:
    if not _smtp_configured():
        return False
    try:
        await asyncio.to_thread(_send_notification_email, request)
        return True
    except Exception:
        logger.exception("Failed to send access request notification")
        return False


@router.post("", response_model=AccessRequestResponse, status_code=201)
async def create_access_request(data: CreateAccessRequest):
    # Hidden honeypot field: silently accept bots without storing their submission.
    if data.website:
        return AccessRequestResponse(
            id="accepted",
            name=data.name,
            email=data.email,
            company=data.company,
            message=data.message,
            status="new",
        )

    supabase = get_supabase()
    try:
        result = (
            supabase.table("access_requests")
            .insert(
                {
                    "name": data.name,
                    "email": data.email,
                    "company": data.company.strip() if data.company else None,
                    "message": data.message,
                    "status": "new",
                }
            )
            .execute()
        )
    except Exception as error:
        logger.exception("Failed to save access request")
        raise HTTPException(
            status_code=503,
            detail=(
                "Access request storage is not configured. "
                "Run the Supabase access-requests migration."
            ),
        ) from error
    rows = _row_dicts(result.data)
    if not rows:
        raise HTTPException(status_code=500, detail="Could not save access request")

    notification_sent = await _try_send_notification(data)
    return AccessRequestResponse(**rows[0], notification_sent=notification_sent)


@router.get("", response_model=list[AccessRequestResponse])
async def list_access_requests(
    _current_account: CurrentAccount = Depends(require_role("admin")),
):
    result = (
        get_supabase()
        .table("access_requests")
        .select("*")
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )
    return [AccessRequestResponse(**row) for row in _row_dicts(result.data)]


@router.patch("/{request_id}", response_model=AccessRequestResponse)
async def update_access_request(
    request_id: str,
    data: UpdateAccessRequest,
    _current_account: CurrentAccount = Depends(require_role("admin")),
):
    update_data: dict[str, Any] = {"status": data.status}
    update_data["reviewed_at"] = (
        datetime.now(timezone.utc).isoformat() if data.status != "new" else None
    )
    result = (
        get_supabase()
        .table("access_requests")
        .update(update_data)
        .eq("id", request_id)
        .execute()
    )
    rows = _row_dicts(result.data)
    if not rows:
        raise HTTPException(status_code=404, detail="Access request not found")
    return AccessRequestResponse(**rows[0])
