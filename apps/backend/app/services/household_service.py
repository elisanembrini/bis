import uuid
from dataclasses import dataclass
from datetime import timedelta
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.clock import Clock, get_clock
from app.core.config import Settings, get_settings
from app.core.errors import (
    AlreadyInHouseholdError,
    CannotRemoveSelfError,
    InviteExpiredError,
    InviteNotFoundError,
    InviteUsedError,
    MemberNotFoundError,
    MustLeaveHouseholdError,
    OwnerCannotLeaveError,
)
from app.db import get_db
from app.models import Household, HouseholdInvite, User
from app.repositories import households, shares, users
from app.schemas.auth import HouseholdRole
from app.schemas.household import (
    HouseholdMemberResponse,
    HouseholdResponse,
    InviteCreatedResponse,
    InvitePreviewResponse,
)
from app.services.tokens import generate_token, hash_token

INVITE_TOKEN_MAX_LENGTH = 200


@dataclass(frozen=True)
class Membership:
    user: User
    household: Household

    @property
    def is_owner(self) -> bool:
        return self.household.owner_id == self.user.id


def invite_link(frontend_base_url: str, token: str) -> str:
    return f"{frontend_base_url.rstrip('/')}/invite/{token}"


class HouseholdService:
    def __init__(self, db: Session, clock: Clock, settings: Settings) -> None:
        self._db = db
        self._clock = clock
        self._settings = settings

    @property
    def db(self) -> Session:
        return self._db

    def describe(self, membership: Membership) -> HouseholdResponse:
        household = membership.household
        members = [
            HouseholdMemberResponse(
                user_id=user.id,
                display_name=user.display_name,
                role=_role(household, user.id),
                joined_at=member.joined_at,
            )
            for user, member in households.list_members(self._db, household.id)
        ]
        members.sort(key=lambda member: member.role != "owner")
        return HouseholdResponse(
            id=household.id, role=_role(household, membership.user.id), members=members
        )

    def create_invite(self, membership: Membership) -> InviteCreatedResponse:
        now = self._clock.now()
        token = generate_token()
        invite = households.add_invite(
            self._db,
            household_id=membership.household.id,
            token_hash=hash_token(token),
            created_by=membership.user.id,
            created_at=now,
            expires_at=now + timedelta(days=self._settings.invite_ttl_days),
        )
        self._db.commit()
        return InviteCreatedResponse(
            url=invite_link(self._settings.frontend_base_url, token),
            expires_at=invite.expires_at,
        )

    def preview_invite(self, token: str) -> InvitePreviewResponse:
        invite = self._usable_invite(token, for_update=False)
        inviter = users.get_by_id(self._db, invite.created_by)
        if inviter is None:
            raise InviteNotFoundError
        return InvitePreviewResponse(
            household_id=invite.household_id,
            inviter_display_name=inviter.display_name,
            expires_at=invite.expires_at,
        )

    def accept_invite(self, user: User, token: str) -> None:
        invite = self._usable_invite(token, for_update=True)
        current = households.get_for_user(self._db, user.id)
        if current is not None:
            if current.id == invite.household_id:
                raise AlreadyInHouseholdError
            if households.count_members(self._db, current.id) > 1:
                raise MustLeaveHouseholdError
            households.delete_household(self._db, current.id)
        self._join(invite, user.id)
        self._db.commit()

    def join_new_user(self, user_id: uuid.UUID, token: str) -> None:
        invite = self._usable_invite(token, for_update=True)
        self._join(invite, user_id)

    def ensure_invite_usable(self, token: str) -> None:
        self._usable_invite(token, for_update=True)

    def remove_member(self, owner: Membership, user_id: uuid.UUID) -> None:
        if user_id == owner.user.id:
            raise CannotRemoveSelfError
        if not households.is_member(self._db, household_id=owner.household.id, user_id=user_id):
            raise MemberNotFoundError
        self._move_to_new_household(owner.household.id, user_id)
        self._db.commit()

    def leave(self, membership: Membership) -> None:
        if membership.is_owner:
            raise OwnerCannotLeaveError
        self._move_to_new_household(membership.household.id, membership.user.id)
        self._db.commit()

    def _usable_invite(self, token: str, *, for_update: bool) -> HouseholdInvite:
        invite = households.get_invite_by_token_hash(
            self._db, hash_token(token), for_update=for_update
        )
        if invite is None:
            raise InviteNotFoundError
        if invite.used_at is not None:
            raise InviteUsedError
        if invite.expires_at <= self._clock.now():
            raise InviteExpiredError
        return invite

    def _join(self, invite: HouseholdInvite, user_id: uuid.UUID) -> None:
        households.add_member(self._db, household_id=invite.household_id, user_id=user_id)
        invite.used_at = self._clock.now()
        invite.used_by = user_id
        self._db.flush()

    def _move_to_new_household(self, household_id: uuid.UUID, user_id: uuid.UUID) -> None:
        shares.delete_involving(self._db, user_id)
        households.remove_member(self._db, household_id=household_id, user_id=user_id)
        households.add_with_owner(self._db, user_id)


def _role(household: Household, user_id: uuid.UUID) -> HouseholdRole:
    return "owner" if household.owner_id == user_id else "member"


def get_household_service(
    db: Annotated[Session, Depends(get_db)],
    clock: Annotated[Clock, Depends(get_clock)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> HouseholdService:
    return HouseholdService(db, clock, settings)
