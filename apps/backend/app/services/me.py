from sqlalchemy.orm import Session

from app.models import User
from app.repositories import households
from app.schemas.auth import HouseholdRole, HouseholdSummary, MeResponse


def describe_user(db: Session, user: User) -> MeResponse:
    household = households.get_for_user(db, user.id)
    if household is None:
        raise RuntimeError(f"User {user.id} has no household")
    role: HouseholdRole = "owner" if household.owner_id == user.id else "member"
    return MeResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        household=HouseholdSummary(id=household.id, role=role),
    )
