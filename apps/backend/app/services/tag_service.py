import uuid
from typing import Annotated

from fastapi import Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import TagAlreadyExistsError, TagNotFoundError
from app.db import get_db
from app.models import Tag, User
from app.repositories import tags
from app.schemas.tag import TagResponse


def _response(tag: Tag, user: User) -> TagResponse:
    return TagResponse(id=tag.id, name=tag.name, is_own=tag.owner_id == user.id)


class TagService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_visible(self, user: User) -> list[TagResponse]:
        return [_response(tag, user) for tag in tags.list_visible(self._db, user.id)]

    def create(self, user: User, name: str) -> TagResponse:
        if tags.name_taken(self._db, user.id, name):
            raise TagAlreadyExistsError
        tag = Tag(owner_id=user.id, name=name)
        try:
            tags.add(self._db, tag)
            self._db.commit()
        except IntegrityError as exc:
            self._db.rollback()
            raise TagAlreadyExistsError from exc
        return _response(tag, user)

    def delete(self, user: User, tag_id: uuid.UUID) -> None:
        tag = tags.get_own(self._db, user.id, tag_id)
        if tag is None:
            raise TagNotFoundError
        tags.delete(self._db, tag)
        self._db.commit()


def get_tag_service(db: Annotated[Session, Depends(get_db)]) -> TagService:
    return TagService(db)
