import uuid

from sqlalchemy.orm import Session

from app.models import Household, HouseholdMember


def add_with_owner(db: Session, owner_id: uuid.UUID) -> Household:
    household = Household(owner_id=owner_id)
    db.add(household)
    db.flush()
    db.add(HouseholdMember(household_id=household.id, user_id=owner_id))
    db.flush()
    return household
