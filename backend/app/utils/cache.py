"""
轻量缓存工具（Redis）。

提供 JSON 值的 get/set 与稳定的 cache key 生成方式：
- 当 Redis 不可用时，函数会自动降级返回 None/False
- 所有异常都会被吞掉，避免缓存影响主流程

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- redis_client（app.extensions）
"""

from __future__ import annotations

import json
import hashlib
from typing import Any

from .. import extensions


def _redis():
    """
    获取 Redis 客户端（可能为 None）。
    """
    return extensions.redis_client


def make_cache_key(prefix: str, payload: dict[str, Any] | None = None) -> str:
    """
    将 payload 进行稳定序列化后做 sha256 摘要，用于生成短 key。
    """
    if not payload:
        return prefix
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"{prefix}:{digest}"


def get_json(key: str):
    """
    获取 JSON 缓存值并反序列化为 Python 对象；失败返回 None。
    """
    r = _redis()
    if r is None:
        return None
    try:
        value = r.get(key)
        if not value:
            return None
        if isinstance(value, (bytes, bytearray)):
            value = value.decode("utf-8")
        return json.loads(value)
    except Exception:
        return None


def set_json(key: str, value, ttl_seconds: int):
    """
    写入 JSON 缓存值；成功返回 True，失败返回 False。
    """
    r = _redis()
    if r is None:
        return False
    try:
        raw = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        r.setex(key, max(int(ttl_seconds), 1), raw)
        return True
    except Exception:
        return False
