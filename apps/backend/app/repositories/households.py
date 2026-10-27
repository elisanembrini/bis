import uuid
from datetime import datetime

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import Household, HouseholdInvite, HouseholdMember, User


def add_with_owner(db: Session, owner_id: uuid.UUID) -> Household:
    household = Household(owner_id=owner_id)
    db.add(household)
    db.flush()
    add_member(db, household_id=household.id, user_id=owner_id)
    return household


def add_member(db: Session, *, household_id: uuid.UUID, user_id: uuid.UUID) -> None:
    db.add(HouseholdMember(household_id=household_id, user_id=user_id))
    db.flush()


def get_by_id(db: Session, household_id: uuid.UUID) -> Household | None:
    return db.get(Household, household_id)


def get_for_user(db: Session, user_id: uuid.UUID) -> Household | None:
    return db.scalar(
        select(Household)
        .join(HouseholdMember, HouseholdMember.household_id == Household.id)
        .where(HouseholdMember.user_id == user_id)
    )


def is_member(db: Session, *, household_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    return (
        db.scalar(
            select(HouseholdMember.user_id).where(
                HouseholdMember.household_id == household_id,
                HouseholdMember.user_id == user_id,
            )
        )
        is not None
    )


def count_members(db: Session, household_id: uuid.UUID) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(HouseholdMember)
            .where(HouseholdMember.household_id == household_id)
        )
        or 0
    )


def list_members(db: Session, household_id: uuid.UUID) -> list[tuple[User, HouseholdMember]]:
    rows = db.execute(
        select(User, HouseholdMember)
        .join(HouseholdMember, HouseholdMember.user_id == User.id)
        .where(HouseholdMember.household_id == household_id)
        .order_by(HouseholdMember.joined_at, User.display_name)
    )
    return [(user, member) for user, member in rows]


def remove_member(db: Session, *, household_id: uuid.UUID, user_id: uuid.UUID) -> None:
    db.execute(
        delete(HouseholdMember).where(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == user_id,
        )
    )


def delete_household(db: Session, household_id: uuid.UUID) -> None:
    db.execute(delete(Household).where(Household.id == household_id))


def add_invite(
    db: Session,
    *,
    household_id: uuid.UUID,
    token_hash: str,
    created_by: uuid.UUID,
    created_at: datetime,
    expires_at: datetime,
) -> HouseholdInvite:
    invite = HouseholdInvite(
        household_id=household_id,
        token_hash=token_hash,
        created_by=created_by,
        created_at=created_at,
        expires_at=expires_at,
    )
    db.add(invite)
    db.flush()
    return invite


def get_invite_by_token_hash(
    db: Session, token_hash: str, *, for_update: bool = False
) -> HouseholdInvite | None:
    statement = select(HouseholdInvite).where(HouseholdInvite.token_hash == token_hash)
    if for_update:
        statement = statement.with_for_update()
    return db.scalar(statement)
