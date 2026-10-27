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
    message = "Email o password non corretti."


class TooManyAttemptsError(DomainError):
    status_code = 429
    code = ErrorCode.TOO_MANY_ATTEMPTS
    message = "Troppi tentativi di accesso. Riprova più tardi."

    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(headers={"Retry-After": str(retry_after_seconds)})
        self.retry_after_seconds = retry_after_seconds


class EmailAlreadyRegisteredError(DomainError):
    status_code = 409
    code = ErrorCode.EMAIL_ALREADY_REGISTERED
    message = "Esiste già un account con questa email."


class ResetTokenInvalidError(DomainError):
    status_code = 400
    code = ErrorCode.RESET_TOKEN_INVALID
    message = "Il link per reimpostare la password non è valido o è scaduto."


class UnauthenticatedError(DomainError):
    status_code = 401
    code = ErrorCode.UNAUTHENTICATED
    message = "Accesso richiesto."


class InviteNotFoundError(DomainError):
    status_code = 404
    code = ErrorCode.INVITE_NOT_FOUND
    message = "Questo invito non esiste."


class InviteExpiredError(DomainError):
    status_code = 410
    code = ErrorCode.INVITE_EXPIRED
    message = "Questo invito è scaduto."


class InviteUsedError(DomainError):
    status_code = 410
    code = ErrorCode.INVITE_USED
    message = "Questo invito è già stato usato."


class AlreadyInHouseholdError(DomainError):
    status_code = 409
    code = ErrorCode.ALREADY_IN_HOUSEHOLD
    message = "Fai già parte di questa casa."


class MustLeaveHouseholdError(DomainError):
    status_code = 409
    code = ErrorCode.MUST_LEAVE_HOUSEHOLD
    message = "Per entrare in questa casa devi prima lasciare quella attuale."


class OwnerCannotLeaveError(DomainError):
    status_code = 409
    code = ErrorCode.OWNER_CANNOT_LEAVE
    message = "Chi è titolare della casa non può lasciarla."


class NotHouseholdOwnerError(DomainError):
    status_code = 403
    code = ErrorCode.NOT_HOUSEHOLD_OWNER
    message = "Solo chi è titolare della casa può farlo."


class MemberNotFoundError(DomainError):
    status_code = 404
    code = ErrorCode.MEMBER_NOT_FOUND
    message = "Questa persona non fa parte della casa."


class CannotRemoveSelfError(DomainError):
    status_code = 400
    code = ErrorCode.CANNOT_REMOVE_SELF
    message = "Non puoi rimuoverti dalla casa."


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
