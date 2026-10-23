import smtplib
import ssl
from email.message import EmailMessage
from typing import Annotated, Protocol

from fastapi import BackgroundTasks, Depends

from app.core.config import Settings, get_settings


class EmailSender(Protocol):
    def send(self, message: EmailMessage) -> None: ...


class SmtpEmailSender:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def send(self, message: EmailMessage) -> None:
        settings = self._settings
        context = ssl.create_default_context()
        client: smtplib.SMTP
        if settings.smtp_security == "ssl":
            client = smtplib.SMTP_SSL(
                settings.smtp_host, settings.smtp_port, timeout=10, context=context
            )
        else:
            client = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
        with client:
            if settings.smtp_security == "starttls":
                client.starttls(context=context)
            if settings.smtp_user and settings.smtp_password:
                client.login(settings.smtp_user, settings.smtp_password.get_secret_value())
            client.send_message(message)


class BackgroundEmailSender:
    def __init__(self, background_tasks: BackgroundTasks, sender: EmailSender) -> None:
        self._background_tasks = background_tasks
        self._sender = sender

    def send(self, message: EmailMessage) -> None:
        self._background_tasks.add_task(self._sender.send, message)


def get_email_sender(
    background_tasks: BackgroundTasks,
    settings: Annotated[Settings, Depends(get_settings)],
) -> EmailSender:
    return BackgroundEmailSender(background_tasks, SmtpEmailSender(settings))
