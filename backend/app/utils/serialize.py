from __future__ import annotations

"""
安全序列化工具。

将 MongoDB 常见类型（ObjectId、datetime）递归转换为可 JSON 序列化的结构，
用于 API 输出与审计日志落库，避免出现 “ObjectId/datetime 无法序列化” 的问题。
"""

from datetime import datetime
from bson import ObjectId


def to_safe_json(value):
    """
    将任意 Python 对象转换为 JSON 安全类型。

    转换规则：
    - datetime -> ISO8601 字符串
    - ObjectId -> 字符串
    - dict/list/tuple -> 递归处理
    - 其它类型 -> str(value)
    """
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [to_safe_json(v) for v in value]
    if isinstance(value, tuple):
        return [to_safe_json(v) for v in value]
    if isinstance(value, dict):
        return {str(k): to_safe_json(v) for k, v in value.items()}
    return str(value)
