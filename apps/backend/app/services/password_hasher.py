from functools import cached_property

from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher


class PasswordHasher:
    def __init__(self) -> None:
        self._hasher = PasswordHash((Argon2Hasher(),))

    @cached_property
    def _dummy_hash(self) -> str:
        return self._hasher.hash("dummy-password-for-timing")

    def hash(self, password: str) -> str:
        return self._hasher.hash(password)

    def verify(self, password: str, password_hash: str) -> tuple[bool, str | None]:
        return self._hasher.verify_and_update(password, password_hash)

    def verify_dummy(self, password: str) -> None:
        self._hasher.verify(password, self._dummy_hash)


password_hasher = PasswordHasher()


def get_password_hasher() -> PasswordHasher:
    return password_hasher
