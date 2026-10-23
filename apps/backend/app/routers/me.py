from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.security import Authenticated, get_authenticated
from app.schemas.auth import MeResponse
from app.schemas.errors import ErrorResponse
from app.services.auth_service import AuthService, get_auth_service

router = APIRouter(tags=["me"])


@router.get(
    "/me",
    response_model=MeResponse,
    responses={status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}},
    operation_id="getMe",
)
def get_me(
    authenticated: Annotated[Authenticated, Depends(get_authenticated)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> MeResponse:
    return service.describe(authenticated.user)
