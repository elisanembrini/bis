import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import FileResponse

from app.core.config import Settings, get_settings
from app.core.errors import PhotoTooLargeError
from app.core.security import Authenticated, get_authenticated
from app.schemas.errors import ErrorResponse
from app.schemas.photo import PhotoUploadResponse
from app.services.photo_service import PHOTO_CONTENT_TYPE, PhotoService, get_photo_service
from app.services.photo_storage import PhotoSize

router = APIRouter(prefix="/photos", tags=["photos"])

Service = Annotated[PhotoService, Depends(get_photo_service)]
CurrentUser = Annotated[Authenticated, Depends(get_authenticated)]

Responses = dict[int | str, dict[str, Any]]

CACHE_HEADERS = {
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
}


async def read_limited_body(
    request: Request, settings: Annotated[Settings, Depends(get_settings)]
) -> bytes:
    limit = settings.photo_max_bytes
    declared = request.headers.get("content-length")
    if declared is not None and declared.isdigit() and int(declared) > limit:
        raise PhotoTooLargeError
    chunks: list[bytes] = []
    received = 0
    async for chunk in request.stream():
        received += len(chunk)
        if received > limit:
            raise PhotoTooLargeError
        chunks.append(chunk)
    return b"".join(chunks)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=PhotoUploadResponse,
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse},
        status.HTTP_413_CONTENT_TOO_LARGE: {"model": ErrorResponse},
        status.HTTP_422_UNPROCESSABLE_CONTENT: {"model": ErrorResponse},
    },
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "application/octet-stream": {"schema": {"type": "string", "format": "binary"}}
            },
        }
    },
    operation_id="uploadPhoto",
)
def upload_photo(
    current: CurrentUser,
    service: Service,
    data: Annotated[bytes, Depends(read_limited_body)],
) -> PhotoUploadResponse:
    return service.upload(current.user, data)


@router.get(
    "/{photo_id}",
    response_class=FileResponse,
    responses={
        status.HTTP_200_OK: {"content": {PHOTO_CONTENT_TYPE: {}}},
        status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
    },
    operation_id="getPhoto",
)
def get_photo(
    photo_id: uuid.UUID,
    current: CurrentUser,
    service: Service,
    size: Annotated[PhotoSize, Query()] = "full",
) -> FileResponse:
    path = service.file_for(current.user, photo_id, size)
    return FileResponse(path, media_type=PHOTO_CONTENT_TYPE, headers=CACHE_HEADERS)
