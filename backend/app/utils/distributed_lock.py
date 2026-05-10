from __future__ import annotations

import secrets
import time


class DistributedLock:
    def __init__(self, redis_client):
        self.redis = redis_client

    def acquire(self, key: str, ttl_ms: int = 5000) -> str | None:
        if self.redis is None:
            return None
        token = secrets.token_hex(16)
        try:
            ok = self.redis.set(key, token, nx=True, px=int(ttl_ms))
            return token if ok else None
        except Exception:
            return None

    def release(self, key: str, token: str) -> bool:
        if self.redis is None:
            return False
        lua = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        try:
            return bool(self.redis.eval(lua, 1, key, token))
        except Exception:
            return False


def backoff_sleep(attempt: int, base_ms: int = 30, cap_ms: int = 250):
    ms = min(cap_ms, base_ms * (2 ** attempt))
    time.sleep(ms / 1000.0)

