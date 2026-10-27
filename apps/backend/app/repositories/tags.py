import uuid
from collections.abc import Collection

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Tag


def list_visible(db: Session, owner_id: uuid.UUID) -> list[Tag]:
    return list(
        db.scalars(
            select(Tag)
            .where(or_(Tag.owner_id.is_(None), Tag.owner_id == owner_id))
            .order_by(Tag.owner_id.is_not(None), func.lower(Tag.name))
        )
    )


def get_visible_many(db: Session, owner_id: uuid.UUID, tag_ids: Collection[uuid.UUID]) -> list[Tag]:
    if not tag_ids:
        return []
    return list(
        db.scalars(
            select(Tag).where(
                Tag.id.in_(tag_ids), or_(Tag.owner_id.is_(None), Tag.owner_id == owner_id)
            )
        )
    )


def name_taken(db: Session, owner_id: uuid.UUID, name: str) -> bool:
    return (
        db.scalar(
            select(Tag.id).where(
                or_(Tag.owner_id.is_(None), Tag.owner_id == owner_id),
                func.lower(Tag.name) == name.lower(),
            )
        )
        is not None
    )


def get_own(db: Session, owner_id: uuid.UUID, tag_id: uuid.UUID) -> Tag | None:
    return db.scalar(select(Tag).where(Tag.id == tag_id, Tag.owner_id == owner_id))


def add(db: Session, tag: Tag) -> None:
    db.add(tag)
    db.flush()


def delete(db: Session, tag: Tag) -> None:
    db.delete(tag)
    db.flush()
