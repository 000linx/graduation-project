from __future__ import annotations

"""
RBAC 数据访问层（DAO）。

该 DAO 面向“管理员后台”的 RBAC 集合：
- admin_permissions：权限字典（name/description）
- admin_roles：角色（name/perm_names）
- admin_user_roles：用户与角色绑定（user_id/role_ids）
"""

from datetime import datetime
from bson import ObjectId

from ...extensions import mongo


class RbacDao:
    """
    RBAC 相关集合的读写操作封装。
    """

    ROLES = "admin_roles"
    PERMS = "admin_permissions"
    USER_ROLES = "admin_user_roles"

    @staticmethod
    def ensure_indexes():
        """
        创建 RBAC 相关集合索引（幂等）。

        说明：索引创建失败不应影响应用启动，因此此处捕获异常并跳过。
        """
        try:
            mongo.db[RbacDao.PERMS].create_index("name", unique=True)
        except Exception:
            pass
        try:
            mongo.db[RbacDao.ROLES].create_index("name", unique=True)
        except Exception:
            pass
        try:
            mongo.db[RbacDao.USER_ROLES].create_index("user_id", unique=True)
        except Exception:
            pass

    @staticmethod
    def upsert_permissions(perms: list[dict]):
        """
        批量写入/更新权限字典（upsert）。

        :param perms: [{"name": "...", "description": "..."}]
        """
        now = datetime.now()
        for p in perms:
            name = p["name"]
            mongo.db[RbacDao.PERMS].update_one(
                {"name": name},
                {"$setOnInsert": {"name": name, "created_at": now}, "$set": {"description": p.get("description", "")}},
                upsert=True,
            )

    @staticmethod
    def list_permissions():
        """
        获取权限字典列表（不返回 _id）。
        """
        return list(mongo.db[RbacDao.PERMS].find({}, projection={"_id": 0}).sort("name", 1))

    @staticmethod
    def get_role_by_name(name: str):
        """
        按角色名查询角色。
        """
        return mongo.db[RbacDao.ROLES].find_one({"name": name})

    @staticmethod
    def create_role(name: str, description: str, perm_names: list[str]):
        """
        创建角色。

        :param perm_names: 权限字符串列表，支持 "*" 表示全权限。
        """
        now = datetime.now()
        doc = {
            "name": name,
            "description": description,
            "perm_names": perm_names,
            "created_at": now,
            "updated_at": now,
        }
        return mongo.db[RbacDao.ROLES].insert_one(doc).inserted_id

    @staticmethod
    def list_roles():
        """
        获取角色列表。
        """
        return list(mongo.db[RbacDao.ROLES].find().sort("name", 1))

    @staticmethod
    def get_role(role_id: str):
        """
        按角色ID查询角色。
        """
        return mongo.db[RbacDao.ROLES].find_one({"_id": ObjectId(role_id)})

    @staticmethod
    def update_role(role_id: str, updates: dict):
        """
        更新角色（部分字段更新），并自动刷新 updated_at。
        """
        updates["updated_at"] = datetime.now()
        return mongo.db[RbacDao.ROLES].update_one({"_id": ObjectId(role_id)}, {"$set": updates})

    @staticmethod
    def delete_role(role_id: str):
        """
        删除角色。
        """
        return mongo.db[RbacDao.ROLES].delete_one({"_id": ObjectId(role_id)})

    @staticmethod
    def set_user_roles(user_id: str, role_ids: list[str]):
        """
        设置用户的角色绑定（upsert）。
        """
        now = datetime.now()
        role_obj_ids = [ObjectId(rid) for rid in role_ids]
        return mongo.db[RbacDao.USER_ROLES].update_one(
            {"user_id": ObjectId(user_id)},
            {"$set": {"user_id": ObjectId(user_id), "role_ids": role_obj_ids, "updated_at": now}, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )

    @staticmethod
    def get_user_role_ids(user_id: str):
        """
        获取用户绑定的角色ID列表（ObjectId 列表）。
        """
        doc = mongo.db[RbacDao.USER_ROLES].find_one({"user_id": ObjectId(user_id)})
        if not doc:
            return []
        return doc.get("role_ids", []) or []

    @staticmethod
    def get_roles_by_ids(role_ids: list[ObjectId]):
        """
        批量按角色ID查询角色文档。
        """
        if not role_ids:
            return []
        return list(mongo.db[RbacDao.ROLES].find({"_id": {"$in": role_ids}}))
