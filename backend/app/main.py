import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    admin,
    agent,
    auth,
    manager,
    profiles,
    realtime,
    scorecards,
    sessions,
)
from app.services.sweeper import run_sweeper


@asynccontextmanager
async def lifespan(app: FastAPI):
    sweeper_task = asyncio.create_task(run_sweeper())
    app.state.sweeper_task = sweeper_task

    try:
        yield
    finally:
        sweeper_task.cancel()
        with suppress(asyncio.CancelledError):
            await sweeper_task


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Sales Coach API",
        version="0.1.0",
        description="Backend API for AI Sales Coach.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002",
            "http://localhost:8080",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
    app.include_router(agent.router, prefix="/api/v1/agent", tags=["agent"])
    app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["sessions"])
    app.include_router(realtime.router, prefix="/api/v1/realtime", tags=["realtime"])
    app.include_router(manager.router, prefix="/api/v1/manager", tags=["manager"])
    app.include_router(
        scorecards.router,
        prefix="/api/v1/scorecards",
        tags=["scorecards"],
    )
    app.include_router(profiles.router, prefix="/api/v1/profile", tags=["profile"])

    @app.get("/health", tags=["health"])
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/v1/health", tags=["health"])
    async def api_healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
