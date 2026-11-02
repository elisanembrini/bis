import math
from collections import deque
from datetime import datetime, timedelta
from functools import lru_cache
from threading import Lock

from app.core.config import get_settings


class SlidingWindowLimiter:
    def __init__(self, max_events: int, window: timedelta) -> None:
        self._max_events = max_events
        self._window = window
        self._events: dict[str, deque[datetime]] = {}
        self._lock = Lock()

    def hit(self, key: str, now: datetime) -> int | None:
        with self._lock:
            events = self._events.setdefault(key, deque())
            while events and now - events[0] >= self._window:
                events.popleft()
            if len(events) >= self._max_events:
                return max(1, math.ceil((events[0] + self._window - now).total_seconds()))
            events.append(now)
            return None


@lru_cache
def _import_limiter() -> SlidingWindowLimiter:
    return SlidingWindowLimiter(
        max_events=get_settings().import_max_per_hour, window=timedelta(hours=1)
    )


def get_import_limiter() -> SlidingWindowLimiter:
    return _import_limiter()
