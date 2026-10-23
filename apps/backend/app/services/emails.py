from email.message import EmailMessage
from urllib.parse import urlencode


def password_reset_link(frontend_base_url: str, token: str) -> str:
    query = urlencode({"token": token})
    return f"{frontend_base_url.rstrip('/')}/reset-password?{query}"


def build_password_reset_email(
    *, sender: str, recipient: str, display_name: str, link: str, ttl_minutes: int
) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = "Reimposta la password di Bis"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        f"Ciao {display_name},\n\n"
        "abbiamo ricevuto una richiesta per reimpostare la password del tuo account Bis.\n"
        f"Apri questo link per sceglierne una nuova (è valido per {ttl_minutes} minuti "
        "e si può usare una sola volta):\n\n"
        f"{link}\n\n"
        "Se non hai fatto tu questa richiesta, ignora questa email: "
        "la tua password resta invariata.\n"
    )
    return message
