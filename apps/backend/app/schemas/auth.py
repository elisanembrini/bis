import uuid
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, EmailStr, Field, StringConstraints

PASSWORD_MIN_LENGTH = 10
PASSWORD_MAX_LENGTH = 128


def _normalize_email(value: str) -> str:
    return value.strip().lower()


NormalizedEmail = Annotated[EmailStr, AfterValidator(_normalize_email)]
NewPassword = Annotated[str, Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)]
DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class RegisterRequest(BaseModel):
    email: NormalizedEmail
    password: NewPassword
    display_name: DisplayName
    invite_token: Annotated[str, Field(min_length=1, max_length=200)] | None = None


class LoginRequest(BaseModel):
    email: NormalizedEmail
    password: Annotated[str, Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)]


class ForgotPasswordRequest(BaseModel):
    email: NormalizedEmail


class ResetPasswordRequest(BaseModel):
    token: Annotated[str, Field(min_length=1, max_length=200)]
    password: NewPassword


HouseholdRole = Literal["owner", "member"]


class HouseholdSummary(BaseModel):
    id: uuid.UUID
    role: HouseholdRole


class MeResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str
    household: HouseholdSummary
