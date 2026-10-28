import time
from typing import Any, Optional, Dict

class SimpleTTLCache:
    """
    In-memory thread-safe TTL cache for PennyWise prototype queries.
    Prevents repeated expensive crawls for identical searches.
    """
    def __init__(self, default_ttl_seconds: int = 300):
        self.default_ttl = default_ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        key = key.strip().lower()
        entry = self._cache.get(key)
        if not entry:
            return None
        
        # Check expiration
        if time.time() > entry["expires_at"]:
            del self._cache[key]
            return None
            
        return entry["data"]

    def set(self, key: str, data: Any, ttl: Optional[int] = None) -> None:
        key = key.strip().lower()
        duration = ttl if ttl is not None else self.default_ttl
        self._cache[key] = {
            "data": data,
            "expires_at": time.time() + duration,
            "cached_at": time.time()
        }

    def clear(self) -> None:
        self._cache.clear()

# Global singleton cache instance
search_cache = SimpleTTLCache(default_ttl_seconds=300)
