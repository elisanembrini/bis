from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from app.core.security import (
    Authenticated,
    clear_session_cookie,
    get_authenticated,
    set_session_cookie,
)
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MeResponse,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.schemas.errors import ErrorResponse
from app.services.auth_service import AuthService, get_auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

Service = Annotated[AuthService, Depends(get_auth_service)]


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=MeResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse},
        status.HTTP_410_GONE: {"model": ErrorResponse},
    },
    operation_id="register",
)
def register(body: RegisterRequest, response: Response, service: Service) -> MeResponse:
    opened = service.register(
        email=body.email,
        password=body.password,
        display_name=body.display_name,
        invite_token=body.invite_token,
    )
    set_session_cookie(response, opened.token, opened.max_age_seconds)
    return service.describe(opened.user)


@router.post(
    "/login",
    response_model=MeResponse,
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse},
        status.HTTP_429_TOO_MANY_REQUESTS: {"model": ErrorResponse},
    },
    operation_id="login",
)
def login(body: LoginRequest, request: Request, response: Response, service: Service) -> MeResponse:
    ip = request.client.host if request.client else "unknown"
    opened = service.login(email=body.email, password=body.password, ip=ip)
    set_session_cookie(response, opened.token, opened.max_age_seconds)
    return service.describe(opened.user)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}},
    operation_id="logout",
)
def logout(
    response: Response,
    authenticated: Annotated[Authenticated, Depends(get_authenticated)],
    service: Service,
) -> None:
    service.logout(authenticated.session_id)
    clear_session_cookie(response)


@router.post(
    "/forgot-password",
    status_code=status.HTTP_202_ACCEPTED,
    operation_id="forgotPassword",
)
def forgot_password(body: ForgotPasswordRequest, service: Service) -> None:
    service.request_password_reset(body.email)


@router.post(
    "/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse}},
    operation_id="resetPassword",
)
def reset_password(body: ResetPasswordRequest, service: Service) -> None:
    service.reset_password(token=body.token, password=body.password)
