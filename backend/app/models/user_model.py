"""
用户模型（MongoDB）。

职责：
- 用户 CRUD（注册/登录所需）
- 密码哈希与校验
- 存储用户角色字段（role），用于区分普通用户与管理员

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- MongoDB collection: users
- werkzeug.security（密码哈希）
"""

from ..extensions import mongo
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from datetime import datetime

class User:
    """
    用户数据模型，负责用户数据的 CRUD 操作
    """
    @staticmethod
    def create(username, phone, password, role="user"):
        """
        创建新用户
        :param username: 用户名
        :param phone: 手机号
        :param password: 明文密码
        :return: 新用户的 ObjectId
        """
        user_data = {
            "username": username,
            "phone": phone,
            "password_hash": generate_password_hash(password),
            "role": role,
            "addresses": [],
            "hearing_profile": None,
            "created_at": datetime.now()
        }
        
        result = mongo.db.users.insert_one(user_data)
        return result.inserted_id

    @staticmethod
    def find_by_phone(phone):
        """
        根据手机号查找用户
        :param phone: 手机号
        :return: 用户文档或 None
        """
        return mongo.db.users.find_one({"phone": phone})

    @staticmethod
    def find_by_email(email):
        return mongo.db.users.find_one({"email": email})

    @staticmethod
    def find_by_id(user_id):
        """
        根据 ID 查找用户
        :param user_id: 用户 ID (字符串或 ObjectId)
        :return: 用户文档或 None
        """
        return mongo.db.users.find_one({"_id": ObjectId(user_id)})

    @staticmethod
    def find_all():
        return list(mongo.db.users.find())

    @staticmethod
    def set_role(user_id, role):
        return mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": role}}
        )

    @staticmethod
    def verify_password(stored_hash, password):
        """
        验证密码
        :param stored_hash: 存储的密码哈希值
        :param password: 输入的明文密码
        :return: 布尔值，是否匹配
        """
        return check_password_hash(stored_hash, password)

    @staticmethod
    def update_password(user_id, new_password):
        return mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password_hash": generate_password_hash(new_password)}}
        )

    @staticmethod
    def list_addresses(user_id):
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)}, projection={"addresses": 1})
        items = (user or {}).get("addresses") or []
        result = []
        for a in items:
            result.append(
                {
                    "_id": str(a.get("_id")),
                    "receiver": a.get("receiver"),
                    "phone": a.get("phone"),
                    "province": a.get("province"),
                    "city": a.get("city"),
                    "district": a.get("district"),
                    "detail": a.get("detail"),
                    "label": a.get("label"),
                    "is_default": bool(a.get("is_default")),
                    "created_at": a.get("created_at"),
                    "updated_at": a.get("updated_at"),
                }
            )
        return result

    @staticmethod
    def add_address(user_id, address: dict):
        uid = ObjectId(user_id)
        user = mongo.db.users.find_one({"_id": uid}, projection={"addresses": 1})
        addresses = (user or {}).get("addresses") or []

        now = datetime.now()
        addr_id = ObjectId()
        is_default = bool(address.get("is_default")) or len(addresses) == 0

        if is_default:
            for a in addresses:
                a["is_default"] = False

        new_addr = {
            "_id": addr_id,
            "receiver": address.get("receiver"),
            "phone": address.get("phone"),
            "province": address.get("province"),
            "city": address.get("city"),
            "district": address.get("district"),
            "detail": address.get("detail"),
            "label": address.get("label"),
            "is_default": is_default,
            "created_at": now,
            "updated_at": now,
        }
        addresses.append(new_addr)
        mongo.db.users.update_one({"_id": uid}, {"$set": {"addresses": addresses}})
        return str(addr_id)

    @staticmethod
    def update_address(user_id, address_id, updates: dict):
        uid = ObjectId(user_id)
        aid = ObjectId(address_id)
        user = mongo.db.users.find_one({"_id": uid}, projection={"addresses": 1})
        addresses = (user or {}).get("addresses") or []

        found = False
        now = datetime.now()
        for a in addresses:
            if a.get("_id") == aid:
                for k in ["receiver", "phone", "province", "city", "district", "detail", "label"]:
                    if k in updates:
                        a[k] = updates.get(k)
                if "is_default" in updates and bool(updates.get("is_default")):
                    for other in addresses:
                        other["is_default"] = False
                    a["is_default"] = True
                a["updated_at"] = now
                found = True
                break

        if not found:
            return False

        mongo.db.users.update_one({"_id": uid}, {"$set": {"addresses": addresses}})
        return True

    @staticmethod
    def delete_address(user_id, address_id):
        uid = ObjectId(user_id)
        aid = ObjectId(address_id)
        user = mongo.db.users.find_one({"_id": uid}, projection={"addresses": 1})
        addresses = (user or {}).get("addresses") or []

        new_list = []
        removed_default = False
        removed = False
        for a in addresses:
            if a.get("_id") == aid:
                removed = True
                removed_default = bool(a.get("is_default"))
                continue
            new_list.append(a)

        if not removed:
            return False

        if removed_default and new_list:
            for i, a in enumerate(new_list):
                a["is_default"] = i == 0

        mongo.db.users.update_one({"_id": uid}, {"$set": {"addresses": new_list}})
        return True

    @staticmethod
    def set_default_address(user_id, address_id):
        uid = ObjectId(user_id)
        aid = ObjectId(address_id)
        user = mongo.db.users.find_one({"_id": uid}, projection={"addresses": 1})
        addresses = (user or {}).get("addresses") or []

        found = False
        for a in addresses:
            if a.get("_id") == aid:
                found = True
                break
        if not found:
            return False

        for a in addresses:
            a["is_default"] = a.get("_id") == aid
            if a["is_default"]:
                a["updated_at"] = datetime.now()

        mongo.db.users.update_one({"_id": uid}, {"$set": {"addresses": addresses}})
        return True

    @staticmethod
    def get_hearing_profile(user_id):
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)}, projection={"hearing_profile": 1})
        return (user or {}).get("hearing_profile")

    @staticmethod
    def set_hearing_profile(user_id, profile: dict):
        payload = dict(profile or {})
        payload["updated_at"] = datetime.now()
        return mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"hearing_profile": payload}}
        )
