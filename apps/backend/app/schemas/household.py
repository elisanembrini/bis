import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.auth import HouseholdRole


class HouseholdMemberResponse(BaseModel):
    user_id: uuid.UUID
    display_name: str
    role: HouseholdRole
    joined_at: datetime


class HouseholdResponse(BaseModel):
    id: uuid.UUID
    role: HouseholdRole
    members: list[HouseholdMemberResponse]


class InviteCreatedResponse(BaseModel):
    url: str
    expires_at: datetime


class InvitePreviewResponse(BaseModel):
    household_id: uuid.UUID
    inviter_display_name: str
    expires_at: datetime
