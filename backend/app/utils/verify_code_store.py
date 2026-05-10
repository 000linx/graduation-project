"""
验证码存储模块：Redis 优先，内存回退。

- Redis 可用时：验证码与频率限制均存入 Redis
- Redis 不可用时：使用进程内存存储，重启后失效（开发/单机场景可用）
"""

import time
import threading

from .. import extensions

_memory_ttl: dict[str, float] = {}
_memory_store: dict[str, str] = {}
_lock = threading.Lock()


def _clean_memory():
    now = time.time()
    with _lock:
        expired = [k for k, exp in _memory_ttl.items() if now >= exp]
        for k in expired:
            _memory_ttl.pop(k, None)
            _memory_store.pop(k, None)


def get_code(email: str) -> str | None:
    _clean_memory()
    r = extensions.redis_client
    if r is not None:
        try:
            val = r.get(f'vc:code:{email}')
            return val.decode() if val else None
        except Exception:
            pass
    with _lock:
        return _memory_store.get(f'vc:code:{email}')


def set_code(email: str, code: str, ttl: int):
    r = extensions.redis_client
    if r is not None:
        try:
            r.setex(f'vc:code:{email}', ttl, code)
            r.setex(f'vc:ratelimit:{email}', 60, '1')
            return
        except Exception:
            pass
    with _lock:
        _memory_store[f'vc:code:{email}'] = code
        _memory_ttl[f'vc:code:{email}'] = time.time() + ttl
        _memory_store[f'vc:ratelimit:{email}'] = '1'
        _memory_ttl[f'vc:ratelimit:{email}'] = time.time() + 60


def delete_code(email: str):
    r = extensions.redis_client
    if r is not None:
        try:
            r.delete(f'vc:code:{email}')
        except Exception:
            pass
    with _lock:
        _memory_store.pop(f'vc:code:{email}', None)
        _memory_ttl.pop(f'vc:code:{email}', None)


def check_rate_limit(email: str) -> int:
    """
    返回剩余限制秒数，0 表示未受限。
    """
    _clean_memory()
    r = extensions.redis_client
    if r is not None:
        try:
            if r.exists(f'vc:ratelimit:{email}'):
                return max(r.ttl(f'vc:ratelimit:{email}'), 1)
            return 0
        except Exception:
            pass
    with _lock:
        if f'vc:ratelimit:{email}' in _memory_ttl:
            remaining = int(_memory_ttl[f'vc:ratelimit:{email}'] - time.time())
            return max(remaining, 1) if remaining > 0 else 0
        return 0
