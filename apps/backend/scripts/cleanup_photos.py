import logging
from datetime import timedelta
from pathlib import Path

from app.core.clock import SystemClock
from app.core.config import get_settings
from app.db import get_sessionmaker
from app.services.photo_service import delete_unlinked_photos
from app.services.photo_storage import PhotoStorage

logger = logging.getLogger("cleanup_photos")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
    settings = get_settings()
    cutoff = SystemClock().now() - timedelta(hours=settings.unlinked_photo_ttl_hours)
    with get_sessionmaker()() as db:
        deleted = delete_unlinked_photos(db, PhotoStorage(Path(settings.photos_dir)), cutoff)
    logger.info("Deleted %d unlinked photos older than %s", deleted, cutoff.isoformat())


if __name__ == "__main__":
    main()
