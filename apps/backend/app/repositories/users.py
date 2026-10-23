import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Household, HouseholdMember, User


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def add(db: Session, *, email: str, password_hash: str, display_name: str) -> User:
    user = User(email=email, password_hash=password_hash, display_name=display_name)
    db.add(user)
    db.flush()
    return user


def get_household(db: Session, user_id: uuid.UUID) -> Household | None:
    return db.scalar(
        select(Household)
        .join(HouseholdMember, HouseholdMember.household_id == Household.id)
        .where(HouseholdMember.user_id == user_id)
    )
