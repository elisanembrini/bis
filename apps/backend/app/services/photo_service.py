import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.clock import Clock, get_clock
from app.core.config import Settings, get_settings
from app.core.errors import PhotoInvalidError, PhotoNotFoundError
from app.db import get_db
from app.models import Photo, User
from app.repositories import photos
from app.schemas.photo import PhotoUploadResponse
from app.services.photo_processing import InvalidImageError, process_photo
from app.services.photo_storage import PhotoSize, PhotoStorage, get_photo_storage

PHOTO_CONTENT_TYPE = "image/webp"


class PhotoService:
    def __init__(
        self, db: Session, clock: Clock, storage: PhotoStorage, settings: Settings
    ) -> None:
        self._db = db
        self._clock = clock
        self._storage = storage
        self._settings = settings

    def upload(self, user: User, data: bytes) -> PhotoUploadResponse:
        try:
            processed = process_photo(data)
        except InvalidImageError as exc:
            raise PhotoInvalidError from exc
        key = self._storage.new_key()
        self._storage.save(key, full=processed.full, thumbnail=processed.thumbnail)
        photo = Photo(
            owner_id=user.id,
            storage_key=key,
            content_type=PHOTO_CONTENT_TYPE,
            width=processed.width,
            height=processed.height,
            size_bytes=len(processed.full),
            created_at=self._clock.now(),
        )
        try:
            photos.add(self._db, photo)
            self._db.commit()
        except Exception:
            self._db.rollback()
            self._storage.delete(key)
            raise
        return PhotoUploadResponse(id=photo.id, width=photo.width, height=photo.height)

    def file_for(self, user: User, photo_id: uuid.UUID, size: PhotoSize) -> Path:
        photo = photos.get(self._db, photo_id)
        if photo is None or not self._can_view(user, photo):
            raise PhotoNotFoundError
        path = self._storage.path(photo.storage_key, size)
        if not path.is_file():
            raise PhotoNotFoundError
        return path

    def cleanup_unlinked(self) -> int:
        cutoff = self._clock.now() - timedelta(hours=self._settings.unlinked_photo_ttl_hours)
        return delete_unlinked_photos(self._db, self._storage, cutoff)

    def _can_view(self, user: User, photo: Photo) -> bool:
        if photo.owner_id == user.id:
            return True
        return photos.visible_through_recipe_of(self._db, photo.id, user.id)


def delete_unlinked_photos(db: Session, storage: PhotoStorage, cutoff: datetime) -> int:
    stale = photos.lock_unlinked_older_than(db, cutoff)
    keys = photos.delete_many(db, [photo.id for photo in stale])
    db.commit()
    for key in keys:
        storage.delete(key)
    return len(keys)


def get_photo_service(
    db: Annotated[Session, Depends(get_db)],
    clock: Annotated[Clock, Depends(get_clock)],
    storage: Annotated[PhotoStorage, Depends(get_photo_storage)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> PhotoService:
    return PhotoService(db, clock, storage, settings)
