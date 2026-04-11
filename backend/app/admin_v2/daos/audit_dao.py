from __future__ import annotations

"""
管理端审计日志数据访问层（DAO）。

用于记录管理员操作轨迹，并提供分页查询能力。
"""

from datetime import datetime
from bson import ObjectId

from ...extensions import mongo


class AuditDao:
    """
    管理端审计日志 DAO：索引、写入与分页查询。
    """

    COL = "admin_audit_logs"

    @staticmethod
    def ensure_indexes():
        """
        创建审计日志索引（幂等）。

        说明：索引创建失败不应影响应用启动，因此此处捕获异常并跳过。
        """
        try:
            mongo.db[AuditDao.COL].create_index([("created_at", -1)])
        except Exception:
            pass
        try:
            mongo.db[AuditDao.COL].create_index([("actor_user_id", 1), ("created_at", -1)])
        except Exception:
            pass
        try:
            mongo.db[AuditDao.COL].create_index([("action", 1), ("created_at", -1)])
        except Exception:
            pass
        try:
            mongo.db[AuditDao.COL].create_index([("resource_type", 1), ("resource_id", 1), ("created_at", -1)])
        except Exception:
            pass

    @staticmethod
    def insert(log: dict):
        """
        写入一条审计日志。

        说明：
        - 自动补齐 created_at
        - actor_user_id / resource_id 若为字符串且可转换为 ObjectId，则会转换为 ObjectId 以便索引命中
        """
        log = dict(log)
        log.setdefault("created_at", datetime.now())
        if "actor_user_id" in log and isinstance(log["actor_user_id"], str):
            try:
                log["actor_user_id"] = ObjectId(log["actor_user_id"])
            except Exception:
                pass
        if "resource_id" in log and isinstance(log["resource_id"], str):
            try:
                log["resource_id"] = ObjectId(log["resource_id"])
            except Exception:
                pass
        return mongo.db[AuditDao.COL].insert_one(log).inserted_id

    @staticmethod
    def list_logs(
        actor_user_id: str | None,
        action: str | None,
        resource_type: str | None,
        resource_id: str | None,
        page: int,
        page_size: int,
    ):
        """
        分页查询审计日志（支持多条件过滤）。

        :return: (logs, total)
        """
        q = {}
        if actor_user_id:
            q["actor_user_id"] = ObjectId(actor_user_id)
        if action:
            q["action"] = action
        if resource_type:
            q["resource_type"] = resource_type
        if resource_id:
            try:
                q["resource_id"] = ObjectId(resource_id)
            except Exception:
                q["resource_id"] = resource_id

        total = mongo.db[AuditDao.COL].count_documents(q)
        cursor = (
            mongo.db[AuditDao.COL]
            .find(q)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        return list(cursor), total
