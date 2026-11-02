from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.schemas.errors import ErrorCode, ErrorResponse


class DomainError(Exception):
    status_code: int = 400
    code: ErrorCode
    message: str

    def __init__(self, headers: dict[str, str] | None = None) -> None:
        super().__init__(self.message)
        self.headers = headers


class InvalidCredentialsError(DomainError):
    status_code = 401
    code = ErrorCode.INVALID_CREDENTIALS
    message = "Incorrect email or password."


class TooManyAttemptsError(DomainError):
    status_code = 429
    code = ErrorCode.TOO_MANY_ATTEMPTS
    message = "Too many sign-in attempts. Try again later."

    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(headers={"Retry-After": str(retry_after_seconds)})
        self.retry_after_seconds = retry_after_seconds


class EmailAlreadyRegisteredError(DomainError):
    status_code = 409
    code = ErrorCode.EMAIL_ALREADY_REGISTERED
    message = "An account with this email already exists."


class ResetTokenInvalidError(DomainError):
    status_code = 400
    code = ErrorCode.RESET_TOKEN_INVALID
    message = "The password reset link is invalid or has expired."


class UnauthenticatedError(DomainError):
    status_code = 401
    code = ErrorCode.UNAUTHENTICATED
    message = "Sign-in required."


class InviteNotFoundError(DomainError):
    status_code = 404
    code = ErrorCode.INVITE_NOT_FOUND
    message = "This invitation does not exist."


class InviteExpiredError(DomainError):
    status_code = 410
    code = ErrorCode.INVITE_EXPIRED
    message = "This invitation has expired."


class InviteUsedError(DomainError):
    status_code = 410
    code = ErrorCode.INVITE_USED
    message = "This invitation has already been used."


class AlreadyInHouseholdError(DomainError):
    status_code = 409
    code = ErrorCode.ALREADY_IN_HOUSEHOLD
    message = "You are already part of this household."


class MustLeaveHouseholdError(DomainError):
    status_code = 409
    code = ErrorCode.MUST_LEAVE_HOUSEHOLD
    message = "To join this household you must first leave your current one."


class OwnerCannotLeaveError(DomainError):
    status_code = 409
    code = ErrorCode.OWNER_CANNOT_LEAVE
    message = "The household owner cannot leave it."


class NotHouseholdOwnerError(DomainError):
    status_code = 403
    code = ErrorCode.NOT_HOUSEHOLD_OWNER
    message = "Only the household owner can do this."


class MemberNotFoundError(DomainError):
    status_code = 404
    code = ErrorCode.MEMBER_NOT_FOUND
    message = "This person is not part of the household."


class CannotRemoveSelfError(DomainError):
    status_code = 400
    code = ErrorCode.CANNOT_REMOVE_SELF
    message = "You cannot remove yourself from the household."


class RecipeNotFoundError(DomainError):
    status_code = 404
    code = ErrorCode.RECIPE_NOT_FOUND
    message = "Recipe not found."


class PhotoTooLargeError(DomainError):
    status_code = 413
    code = ErrorCode.PHOTO_TOO_LARGE
    message = "The photo is larger than 10 MB."


class PhotoInvalidError(DomainError):
    status_code = 422
    code = ErrorCode.PHOTO_INVALID
    message = "The file is not a valid JPEG, PNG, WebP or HEIC image."


class PhotoNotFoundError(DomainError):
    status_code = 404
    code = ErrorCode.PHOTO_NOT_FOUND
    message = "Photo not found."


class PhotoNotAvailableError(DomainError):
    status_code = 422
    code = ErrorCode.PHOTO_NOT_AVAILABLE
    message = "One of the photos is not available for this recipe."


class TagAlreadyExistsError(DomainError):
    status_code = 409
    code = ErrorCode.TAG_ALREADY_EXISTS
    message = "A tag with this name already exists."


class TagNotFoundError(DomainError):
    status_code = 404
    code = ErrorCode.TAG_NOT_FOUND
    message = "Tag not found."


class TagNotAvailableError(DomainError):
    status_code = 422
    code = ErrorCode.TAG_NOT_AVAILABLE
    message = "One of the tags is not available."


class RecipeReadOnlyError(DomainError):
    status_code = 403
    code = ErrorCode.RECIPE_READ_ONLY
    message = "This recipe is shared with you as read-only."


class ShareNotAllowedError(DomainError):
    status_code = 422
    code = ErrorCode.SHARE_NOT_ALLOWED
    message = "You can only share a recipe with people in your household."


class CannotCopyOwnError(DomainError):
    status_code = 409
    code = ErrorCode.CANNOT_COPY_OWN
    message = "This recipe is already in your recipe book."


class GoogleLoginError(Exception):
    def __init__(self, code: ErrorCode) -> None:
        super().__init__(code)
        self.code = code


async def handle_domain_error(_: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, DomainError):
        raise exc
    body = ErrorResponse(code=exc.code, message=exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content=body.model_dump(mode="json"),
        headers=exc.headers,
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DomainError, handle_domain_error)
