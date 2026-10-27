import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, status

from app.core.security import Authenticated, get_authenticated
from app.schemas.errors import ErrorResponse
from app.schemas.tag import TagInput, TagResponse
from app.services.tag_service import TagService, get_tag_service

router = APIRouter(prefix="/tags", tags=["tags"])

Service = Annotated[TagService, Depends(get_tag_service)]
CurrentUser = Annotated[Authenticated, Depends(get_authenticated)]

Responses = dict[int | str, dict[str, Any]]
UNAUTHENTICATED: Responses = {status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}}


@router.get(
    "", response_model=list[TagResponse], responses=UNAUTHENTICATED, operation_id="listTags"
)
def list_tags(current: CurrentUser, service: Service) -> list[TagResponse]:
    return service.list_visible(current.user)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=TagResponse,
    responses={**UNAUTHENTICATED, status.HTTP_409_CONFLICT: {"model": ErrorResponse}},
    operation_id="createTag",
)
def create_tag(body: TagInput, current: CurrentUser, service: Service) -> TagResponse:
    return service.create(current.user, body.name)


@router.delete(
    "/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**UNAUTHENTICATED, status.HTTP_404_NOT_FOUND: {"model": ErrorResponse}},
    operation_id="deleteTag",
)
def delete_tag(tag_id: uuid.UUID, current: CurrentUser, service: Service) -> None:
    service.delete(current.user, tag_id)
