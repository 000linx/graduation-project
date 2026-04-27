"""
RBAC 业务服务（Service）。

职责：
- 初始化默认权限与默认角色
- 计算用户的权限集合（角色 -> 权限）
- 将权限集合缓存到 Redis（基于 rbac_version 做版本化失效）
- 提供 Controller 使用的 require(permission) 校验入口

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Redis cache（utils.cache）
- MongoDB RBAC DAO（admin_v2.daos）
"""

from __future__ import annotations

from ...utils.cache import get_json, set_json
from ...utils.errors import ForbiddenError, NotFoundError, ValidationError
from ..daos.rbac_dao import RbacDao
from ..daos.user_dao import AdminUserDao


DEFAULT_PERMISSIONS = [
    {"name": "admin.stats.read", "description": "查看后台统计"},
    {"name": "admin.users.read", "description": "查看用户列表"},
    {"name": "admin.users.set_role", "description": "修改用户角色"},
    {"name": "admin.users.set_rbac_roles", "description": "分配RBAC角色"},
    {"name": "admin.products.create", "description": "新增商品"},
    {"name": "admin.products.update", "description": "编辑商品"},
    {"name": "admin.products.delete", "description": "删除商品"},
    {"name": "admin.orders.read", "description": "查看订单列表"},
    {"name": "admin.orders.update_status", "description": "修改订单状态"},
    {"name": "admin.orders.process_after_sale", "description": "处理售后"},
    {"name": "admin.rbac.manage", "description": "管理RBAC配置"},
    {"name": "admin.audit.read", "description": "查看审计日志"},
]


class RbacService:
    @staticmethod
    def ensure_defaults():
        """
        初始化系统内置权限与内置角色（幂等）。
        """
        RbacDao.upsert_permissions(DEFAULT_PERMISSIONS)

        if not RbacDao.get_role_by_name("super_admin"):
            RbacDao.create_role("super_admin", "超级管理员", ["*"])

        if not RbacDao.get_role_by_name("admin_basic"):
            RbacDao.create_role("admin_basic", "基础管理员", [p["name"] for p in DEFAULT_PERMISSIONS])

        if not RbacDao.get_role_by_name("audit_viewer"):
            RbacDao.create_role("audit_viewer", "审计查看者", ["admin.audit.read"])

    @staticmethod
    def _cache_key(user_id: str, rbac_version: int):
        """
        生成权限缓存 key：同一用户在 rbac_version 变化后将自动缓存失效。
        """
        return f"rbac:perm:{user_id}:{rbac_version}"

    @staticmethod
    def _match_permission(granted: set[str], required: str) -> bool:
        """
        权限匹配规则：
        - 拥有 "*" 表示全权限
        - 精确匹配 required
        - 允许 "xxx.*" 的前缀匹配
        """
        if "*" in granted:
            return True
        if required in granted:
            return True
        for p in granted:
            if p.endswith(".*") and required.startswith(p[:-1]):
                return True
        return False

    @staticmethod
    def get_user_permissions(user_id: str):
        """
        获取用户的权限集合，并使用 Redis 缓存结果。

        :return: (permissions_set, rbac_version)
        """
        AdminUserDao.ensure_rbac_version(user_id)
        user = AdminUserDao.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        version = int(user.get("rbac_version") or 0)
        key = RbacService._cache_key(user_id, version)
        cached = get_json(key)
        if isinstance(cached, list):
            return set(cached), version

        role_ids = RbacDao.get_user_role_ids(user_id)
        roles = RbacDao.get_roles_by_ids(role_ids)
        perm_set: set[str] = set()
        for r in roles:
            for p in r.get("perm_names", []) or []:
                perm_set.add(p)

        set_json(key, sorted(list(perm_set)), ttl_seconds=300)
        return perm_set, version

    @staticmethod
    def ensure_admin_user_initialized(user_id: str):
        """
        确保管理员用户至少绑定一个 RBAC 角色。

        当前策略：若没有绑定角色，则给该管理员分配 super_admin。
        """
        role_ids = RbacDao.get_user_role_ids(user_id)
        if role_ids:
            return
        super_role = RbacDao.get_role_by_name("super_admin")
        if not super_role:
            RbacService.ensure_defaults()
            super_role = RbacDao.get_role_by_name("super_admin")
        if super_role:
            RbacDao.set_user_roles(user_id, [str(super_role["_id"])])
            AdminUserDao.bump_rbac_version(user_id)

    @staticmethod
    def require(user_id: str, permission: str):
        """
        权限校验入口：用户不具备指定权限时抛出 ForbiddenError。
        """
        perm_set, _ = RbacService.get_user_permissions(user_id)
        if not RbacService._match_permission(perm_set, permission):
            raise ForbiddenError("Permission denied")

    @staticmethod
    def list_roles():
        """
        获取所有 RBAC 角色列表。
        """
        return RbacDao.list_roles()

    @staticmethod
    def list_permissions():
        """
        获取系统权限字典列表。
        """
        return RbacDao.list_permissions()

    @staticmethod
    def create_role(name: str, description: str, perm_names: list[str]):
        """
        创建角色。
        """
        if not name or not isinstance(name, str):
            raise ValidationError("Invalid role name")
        if not perm_names:
            raise ValidationError("perm_names required")
        return RbacDao.create_role(name, description or "", perm_names)

    @staticmethod
    def update_role(role_id: str, name: str | None, description: str | None, perm_names: list[str] | None):
        """
        更新角色（部分字段更新）。
        """
        updates = {}
        if name is not None:
            updates["name"] = name
        if description is not None:
            updates["description"] = description
        if perm_names is not None:
            updates["perm_names"] = perm_names
        if not updates:
            raise ValidationError("No updates")
        return RbacDao.update_role(role_id, updates)

    @staticmethod
    def delete_role(role_id: str):
        """
        删除角色。
        """
        return RbacDao.delete_role(role_id)

    @staticmethod
    def set_user_roles(user_id: str, role_ids: list[str]):
        """
        设置用户角色绑定，并递增 rbac_version 使缓存失效。
        """
        roles = []
        for rid in role_ids:
            role = RbacDao.get_role(rid)
            if not role:
                raise NotFoundError("Role not found")
            roles.append(role)
        RbacDao.set_user_roles(user_id, role_ids)
        AdminUserDao.bump_rbac_version(user_id)
        return roles

    @staticmethod
    def assign_default_admin_role(user_id: str):
        """
        为新晋管理员分配默认角色 admin_basic，并递增 rbac_version。
        """
        basic = RbacDao.get_role_by_name("admin_basic")
        if not basic:
            RbacService.ensure_defaults()
            basic = RbacDao.get_role_by_name("admin_basic")
        if not basic:
            raise NotFoundError("Default role not found")
        RbacDao.set_user_roles(user_id, [str(basic["_id"])])
        AdminUserDao.bump_rbac_version(user_id)
        return basic
