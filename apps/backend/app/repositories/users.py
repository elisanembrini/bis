import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Household, HouseholdMember, User


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def get_by_google_sub(db: Session, google_sub: str) -> User | None:
    return db.scalar(select(User).where(User.google_sub == google_sub))


def add(
    db: Session,
    *,
    email: str,
    display_name: str,
    password_hash: str | None = None,
    google_sub: str | None = None,
) -> User:
    user = User(
        email=email,
        password_hash=password_hash,
        google_sub=google_sub,
        display_name=display_name,
    )
    db.add(user)
    db.flush()
    return user


def get_household(db: Session, user_id: uuid.UUID) -> Household | None:
    return db.scalar(
        select(Household)
        .join(HouseholdMember, HouseholdMember.household_id == Household.id)
        .where(HouseholdMember.user_id == user_id)
    )
