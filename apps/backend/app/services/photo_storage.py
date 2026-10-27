import logging
import os
import secrets
import shutil
from pathlib import Path
from typing import Annotated, Literal

from fastapi import Depends

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)

PhotoSize = Literal["full", "thumb"]


class PhotoStorage:
    def __init__(self, root: Path) -> None:
        self._root = root

    @staticmethod
    def new_key() -> str:
        return secrets.token_hex(16)

    def path(self, key: str, size: PhotoSize) -> Path:
        suffix = ".webp" if size == "full" else ".thumb.webp"
        return self._root / key[:2] / f"{key}{suffix}"

    def save(self, key: str, *, full: bytes, thumbnail: bytes) -> None:
        files: tuple[tuple[PhotoSize, bytes], ...] = (("full", full), ("thumb", thumbnail))
        for size, content in files:
            target = self.path(key, size)
            target.parent.mkdir(parents=True, exist_ok=True)
            temporary = target.with_name(f".{target.name}.tmp")
            temporary.write_bytes(content)
            os.replace(temporary, target)

    def duplicate(self, key: str) -> str:
        new_key = self.new_key()
        sizes: tuple[PhotoSize, ...] = ("full", "thumb")
        for size in sizes:
            target = self.path(new_key, size)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(self.path(key, size), target)
        return new_key

    def delete(self, key: str) -> None:
        sizes: tuple[PhotoSize, ...] = ("full", "thumb")
        for size in sizes:
            try:
                self.path(key, size).unlink(missing_ok=True)
            except OSError:
                logger.exception("Could not delete photo file %s (%s)", key, size)


def get_photo_storage(settings: Annotated[Settings, Depends(get_settings)]) -> PhotoStorage:
    return PhotoStorage(Path(settings.photos_dir))
