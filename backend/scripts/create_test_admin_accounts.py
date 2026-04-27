"""
创建管理端测试账号（开发环境脚本）。

职责：
- 为三种管理员权限级别创建（或更新）测试账号，并绑定对应 RBAC 角色
- 脚本幂等：重复执行会更新账号信息与角色绑定

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Flask app factory: app.create_app
- MongoDB collections: users, admin_roles, admin_user_roles
- RBAC defaults: app.admin_v2.services.rbac_service.RbacService
"""

import os
import sys
from datetime import datetime

from bson import ObjectId
from werkzeug.security import generate_password_hash

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import mongo
from app.admin_v2.services.rbac_service import RbacService


def _upsert_admin_user(username: str, phone: str, password: str, rbac_role_name: str):
    """
    创建或更新一个管理员用户，并绑定到指定 RBAC 角色。

    Args:
        username: 用户名（会被写入 users.username）。
        phone: 手机号（会被写入 users.phone）。
        password: 明文密码（会被哈希存储到 users.password_hash）。
        rbac_role_name: admin_roles.name（如 super_admin/admin_basic/audit_viewer）。

    Returns:
        str: 用户 ID（ObjectId 的字符串形式）。

    Raises:
        RuntimeError: 当指定 RBAC 角色不存在时抛出。
    """
    RbacService.ensure_defaults()
    role = mongo.db.admin_roles.find_one({"name": rbac_role_name})
    if not role:
        raise RuntimeError(f"{rbac_role_name} role not found")

    now = datetime.now()
    user = mongo.db.users.find_one({"$or": [{"username": username}, {"phone": phone}]})
    if user:
        mongo.db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "username": username,
                    "phone": phone,
                    "password_hash": generate_password_hash(password),
                    "role": "admin",
                },
                "$setOnInsert": {"created_at": now},
            },
        )
        user_id = user["_id"]
    else:
        user_id = mongo.db.users.insert_one(
            {
                "username": username,
                "phone": phone,
                "password_hash": generate_password_hash(password),
                "role": "admin",
                "rbac_version": 0,
                "created_at": now,
            }
        ).inserted_id

    mongo.db.admin_user_roles.update_one(
        {"user_id": ObjectId(user_id)},
        {
            "$set": {"user_id": ObjectId(user_id), "role_ids": [role["_id"]], "updated_at": now},
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"rbac_version": 1}})
    return str(user_id)


def main():
    """
    脚本入口：在 development 配置下创建三类管理员测试账号（密码统一为 123456）。

    Raises:
        Exception: 当应用初始化或数据库操作失败时抛出。
    """
    password = "123456"
    test_users = [
        {"username": "test_super_admin", "phone": "19900000001", "role": "super_admin"},
        {"username": "test_admin", "phone": "19900000002", "role": "admin_basic"},
        {"username": "test_audit_admin", "phone": "19900000003", "role": "audit_viewer"},
    ]

    app = create_app("development")
    with app.app_context():
        created = []
        for u in test_users:
            user_id = _upsert_admin_user(u["username"], u["phone"], password, u["role"])
            created.append({"user_id": user_id, "phone": u["phone"], "rbac_role": u["role"]})
        print("OK", created)


if __name__ == "__main__":
    main()
