from fastapi import APIRouter

router = APIRouter()


@router.post("/login")
async def login() -> dict[str, str]:
    return {"message": "Login contract placeholder"}


@router.post("/logout")
async def logout() -> dict[str, str]:
    return {"message": "Logout contract placeholder"}
