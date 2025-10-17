from fastapi import APIRouter, Request, Response
from src.controllers import auth_controller

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup")
async def call_signup(request: Request):
    return await auth_controller.signup_controller(request)

@router.post("/login")
async def call_login(request: Request, response: Response):
    return await auth_controller.login_controller(request, response)

@router.post("/logout")
async def call_logout(response: Response):
    return await auth_controller.logout_controller(response)

@router.get("/profile")
async def call_profile(request: Request):
    return await auth_controller.profile_controller(request)
