from __future__ import annotations

"""
管理端审计服务（Service）。

负责从当前请求上下文提取信息，并写入结构化审计日志。
"""

from flask import request

from ...utils.serialize import to_safe_json
from ..daos.audit_dao import AuditDao


SENSITIVE_KEYS = {"password", "password_hash", "refresh_token", "X-Admin-Bootstrap-Secret"}


def _sanitize(value):
    """
    对输入数据进行递归脱敏，避免敏感信息进入审计日志。
    """
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            if str(k) in SENSITIVE_KEYS:
                out[str(k)] = "***"
            else:
                out[str(k)] = _sanitize(v)
        return out
    if isinstance(value, list):
        return [_sanitize(v) for v in value]
    return value


class AuditService:
    @staticmethod
    def log(
        actor_user_id: str | None,
        action: str,
        resource_type: str | None,
        resource_id: str | None,
        success: bool,
        status_code: int,
        error: str | None = None,
    ):
        """
        写入审计日志。

        :param actor_user_id: 操作人用户ID（字符串）
        :param action: 动作标识（建议使用 admin.<resource>.<action> 形式）
        :param resource_type/resource_id: 被操作资源（可选）
        :param success/status_code/error: 执行结果信息
        """
        try:
            headers = {
                "user_agent": request.headers.get("User-Agent"),
                "x_forwarded_for": request.headers.get("X-Forwarded-For"),
            }
            payload = {
                "actor_user_id": actor_user_id,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "success": bool(success),
                "status_code": int(status_code),
                "method": request.method,
                "path": request.path,
                "ip": request.remote_addr,
                "headers": to_safe_json(headers),
                "query": to_safe_json(request.args.to_dict()),
                "json": to_safe_json(_sanitize(request.get_json(silent=True) or {})),
                "error": error,
            }
            AuditDao.insert(payload)
        except Exception:
            return False
        return True
