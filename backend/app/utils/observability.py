import logfire

from app.config import settings


def configure_observability() -> None:
    logfire.configure(
        token=settings.logfire_token,
        service_name=settings.logfire_service_name,
        environment=settings.logfire_environment,
        send_to_logfire=settings.logfire_send_to_logfire,
    )

    logfire.instrument_openai()