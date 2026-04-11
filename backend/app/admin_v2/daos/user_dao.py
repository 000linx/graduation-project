from __future__ import annotations

"""
管理端用户数据访问层（DAO）。

封装 MongoDB 用户表在后台管理场景下的查询、更新与索引初始化逻辑。
"""

from datetime import datetime
from bson import ObjectId

from ...extensions import mongo


class AdminUserDao:
    """
    管理端用户 DAO：索引、列表查询、角色/版本字段维护、管理员创建等。
    """

    @staticmethod
    def ensure_indexes():
        """
        创建管理端常用索引（幂等）。

        说明：索引创建失败不应影响应用启动，因此此处捕获异常并跳过。
        """
        try:
            mongo.db.users.create_index("phone", unique=True)
        except Exception:
            pass
        try:
            mongo.db.users.create_index("role")
        except Exception:
            pass
        try:
            mongo.db.users.create_index("created_at")
        except Exception:
            pass

    @staticmethod
    def get_by_id(user_id: str):
        """
        根据用户ID查询用户文档。
        """
        return mongo.db.users.find_one({"_id": ObjectId(user_id)})

    @staticmethod
    def set_legacy_role(user_id: str, role: str):
        """
        设置旧版 role 字段（兼容 user/admin 二值角色）。
        """
        return mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": role}})

    @staticmethod
    def ensure_rbac_version(user_id: str):
        """
        确保用户存在 rbac_version 字段（用于 RBAC 权限缓存版本号）。
        """
        return mongo.db.users.update_one(
            {"_id": ObjectId(user_id), "rbac_version": {"$exists": False}},
            {"$set": {"rbac_version": 0}},
        )

    @staticmethod
    def bump_rbac_version(user_id: str):
        """
        RBAC 版本号递增：当用户角色绑定变化时调用，用于使缓存失效。
        """
        return mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"rbac_version": 1}})

    @staticmethod
    def list_users(
        q: str | None,
        role: str | None,
        page: int,
        page_size: int,
        sort: str,
    ):
        """
        用户列表查询（支持搜索/过滤/分页/排序），并默认排除 password_hash。

        :param q: 关键词（username/phone 模糊匹配）
        :param role: user | admin
        :param page: 页码（从 1 开始）
        :param page_size: 每页数量
        :param sort: created_at_asc|created_at_desc|username_asc|username_desc
        :return: (users, total)
        """
        query = {}
        if role:
            query["role"] = role
        if q:
            query["$or"] = [
                {"username": {"$regex": q, "$options": "i"}},
                {"phone": {"$regex": q, "$options": "i"}},
            ]

        sort_field = "created_at"
        sort_dir = -1
        if sort in ("created_at_asc", "created_at_desc"):
            sort_dir = 1 if sort.endswith("_asc") else -1
        elif sort in ("username_asc", "username_desc"):
            sort_field = "username"
            sort_dir = 1 if sort.endswith("_asc") else -1

        total = mongo.db.users.count_documents(query)
        cursor = (
            mongo.db.users.find(
                query,
                projection={
                    "password_hash": 0,
                },
            )
            .sort(sort_field, sort_dir)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(cursor)
        return items, total

    @staticmethod
    def create_admin_user(username: str, phone: str, password_hash: str):
        """
        创建管理员用户（role=admin），并初始化 rbac_version。

        注意：此处要求 password_hash 已经是加密后的哈希，不接受明文。
        """
        doc = {
            "username": username,
            "phone": phone,
            "password_hash": password_hash,
            "role": "admin",
            "rbac_version": 0,
            "created_at": datetime.now(),
        }
        return mongo.db.users.insert_one(doc).inserted_id
