from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agent, auth, realtime, sessions


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Sales Coach API",
        version="0.1.0",
        description="Backend API for AI Sales Coach.",

    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:8080",
            "http://localhost:8080",
            "https://*.pages.dev",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(agent.router, prefix="/api/v1/agent", tags=["agent"])
    app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["sessions"])
    app.include_router(realtime.router, prefix="/api/v1/realtime", tags=["realtime"])

    @app.get("/health", tags=["health"])
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/v1/health", tags=["health"])
    async def api_healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
