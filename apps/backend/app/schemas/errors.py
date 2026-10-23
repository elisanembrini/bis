from enum import StrEnum

from pydantic import BaseModel


class ErrorCode(StrEnum):
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS"
    EMAIL_ALREADY_REGISTERED = "EMAIL_ALREADY_REGISTERED"
    RESET_TOKEN_INVALID = "RESET_TOKEN_INVALID"
    UNAUTHENTICATED = "UNAUTHENTICATED"


class ErrorResponse(BaseModel):
    code: ErrorCode
    message: str
