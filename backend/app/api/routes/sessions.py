from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_sessions() -> dict[str, list]:
    return {"sessions": []}


@router.post("/")
async def create_session() -> dict[str, str]:
    return {"message": "Session creation placeholder"}
