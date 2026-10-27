import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Path, status

from app.core.security import Authenticated, get_authenticated, get_membership, require_owner
from app.schemas.auth import MeResponse
from app.schemas.errors import ErrorResponse
from app.schemas.household import (
    HouseholdResponse,
    InviteCreatedResponse,
    InvitePreviewResponse,
)
from app.services.household_service import (
    INVITE_TOKEN_MAX_LENGTH,
    HouseholdService,
    Membership,
    get_household_service,
)
from app.services.me import describe_user

router = APIRouter(prefix="/household", tags=["household"])

Service = Annotated[HouseholdService, Depends(get_household_service)]
MemberOf = Annotated[Membership, Depends(get_membership)]
OwnerOf = Annotated[Membership, Depends(require_owner)]
InviteToken = Annotated[str, Path(max_length=INVITE_TOKEN_MAX_LENGTH)]

Responses = dict[int | str, dict[str, Any]]

UNAUTHENTICATED: Responses = {status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}}
OWNER_ONLY: Responses = {
    **UNAUTHENTICATED,
    status.HTTP_403_FORBIDDEN: {"model": ErrorResponse},
}
INVITE_ERRORS: Responses = {
    status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
    status.HTTP_410_GONE: {"model": ErrorResponse},
}


@router.get(
    "", response_model=HouseholdResponse, responses=UNAUTHENTICATED, operation_id="getHousehold"
)
def get_household(membership: MemberOf, service: Service) -> HouseholdResponse:
    return service.describe(membership)


@router.post(
    "/invites",
    status_code=status.HTTP_201_CREATED,
    response_model=InviteCreatedResponse,
    responses=OWNER_ONLY,
    operation_id="createInvite",
)
def create_invite(owner: OwnerOf, service: Service) -> InviteCreatedResponse:
    return service.create_invite(owner)


@router.get(
    "/invites/{token}",
    response_model=InvitePreviewResponse,
    responses=INVITE_ERRORS,
    operation_id="previewInvite",
)
def preview_invite(token: InviteToken, service: Service) -> InvitePreviewResponse:
    return service.preview_invite(token)


@router.post(
    "/invites/{token}/accept",
    response_model=MeResponse,
    responses={
        **UNAUTHENTICATED,
        **INVITE_ERRORS,
        status.HTTP_409_CONFLICT: {"model": ErrorResponse},
    },
    operation_id="acceptInvite",
)
def accept_invite(
    token: InviteToken,
    authenticated: Annotated[Authenticated, Depends(get_authenticated)],
    service: Service,
) -> MeResponse:
    service.accept_invite(authenticated.user, token)
    return describe_user(service.db, authenticated.user)


@router.delete(
    "/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        **OWNER_ONLY,
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
    },
    operation_id="removeMember",
)
def remove_member(user_id: uuid.UUID, owner: OwnerOf, service: Service) -> None:
    service.remove_member(owner, user_id)


@router.post(
    "/leave",
    response_model=MeResponse,
    responses={**UNAUTHENTICATED, status.HTTP_409_CONFLICT: {"model": ErrorResponse}},
    operation_id="leaveHousehold",
)
def leave_household(membership: MemberOf, service: Service) -> MeResponse:
    service.leave(membership)
    return describe_user(service.db, membership.user)
