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
