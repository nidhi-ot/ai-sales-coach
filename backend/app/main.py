from fastapi import FastAPI

from app.api.routes import auth, realtime, sessions


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Sales Coach API",
        version="0.1.0",
        description="Backend API for AI Sales Coach.",
    )

    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["sessions"])
    app.include_router(realtime.router, prefix="/api/v1/realtime", tags=["realtime"])

    @app.get("/health", tags=["health"])
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
