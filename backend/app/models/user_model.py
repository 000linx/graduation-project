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
from datetime import datetime, timedelta

class User:
    """
    用户数据模型，负责用户数据的 CRUD 操作

    账户状态枚举：
    - "active": 正常使用中
    - "pending_deletion": 已申请注销，处于冷静期
    - "deleted": 已注销（软删除）
    """
    DEFAULT_NOTIFICATION_SETTINGS = {
        "email_notifications": True,
        "in_app_notifications": True,
        "activity_reminders": True,
    }

    DELETION_COOLING_DAYS = 15

    VALID_ACCOUNT_STATUSES = ("active", "pending_deletion", "deleted")

    @staticmethod
    def ensure_indexes():
        try:
            mongo.db.users.create_index([("phone", 1)], unique=True)
        except Exception:
            pass
        try:
            mongo.db.users.create_index([("account_status", 1), ("deletion_cooling_until", 1)])
        except Exception:
            pass

    @staticmethod
    def create(username, phone, password, role="user", email=None):
        """
        创建新用户
        :param username: 用户名
        :param phone: 手机号
        :param password: 明文密码
        :param role: 用户角色
        :param email: 邮箱地址（可选）
        :return: 新用户的 ObjectId
        """
        user_data = {
            "username": username,
            "phone": phone,
            "password_hash": generate_password_hash(password),
            "role": role,
            "addresses": [],
            "hearing_profile": None,
            "notification_settings": dict(User.DEFAULT_NOTIFICATION_SETTINGS),
            "created_at": datetime.now()
        }
        if email:
            user_data["email"] = email
            user_data["email_verified"] = True

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
        return mongo.db.users.find_one({
            "email": email,
            "account_status": {"$nin": ["pending_deletion", "deleted"]}
        })

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

    @staticmethod
    def get_notification_settings(user_id):
        user = mongo.db.users.find_one(
            {"_id": ObjectId(user_id)},
            projection={"notification_settings": 1}
        )
        s = (user or {}).get("notification_settings")
        if not isinstance(s, dict):
            return dict(User.DEFAULT_NOTIFICATION_SETTINGS)
        merged = dict(User.DEFAULT_NOTIFICATION_SETTINGS)
        for k in merged.keys():
            if k in s:
                merged[k] = bool(s.get(k))
        return merged

    @staticmethod
    def set_notification_settings(user_id, settings: dict):
        payload = dict(User.DEFAULT_NOTIFICATION_SETTINGS)
        for k in payload.keys():
            if k in (settings or {}):
                payload[k] = bool(settings.get(k))
        payload["updated_at"] = datetime.now()
        return mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"notification_settings": payload}}
        )

    @staticmethod
    def request_deletion(user_id):
        now = datetime.now()
        cooling_until = now + timedelta(days=User.DELETION_COOLING_DAYS)
        return mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "account_status": "pending_deletion",
                "deletion_requested_at": now,
                "deletion_cooling_until": cooling_until
            }}
        )

    @staticmethod
    def cancel_deletion(user_id):
        return mongo.db.users.update_one(
            {"_id": ObjectId(user_id), "account_status": "pending_deletion"},
            {"$set": {"account_status": "active"},
             "$unset": {"deletion_requested_at": "", "deletion_cooling_until": ""}}
        )

    @staticmethod
    def get_deletion_status(user_id):
        user = mongo.db.users.find_one(
            {"_id": ObjectId(user_id)},
            projection={"account_status": 1, "deletion_requested_at": 1, "deletion_cooling_until": 1}
        )
        if not user:
            return None
        return {
            "account_status": user.get("account_status", "active"),
            "deletion_requested_at": user.get("deletion_requested_at"),
            "deletion_cooling_until": user.get("deletion_cooling_until"),
        }

    @staticmethod
    def anonymize_user(user_id):
        now = datetime.now()
        anonymized_phone = f"deleted_{str(user_id)}_{int(now.timestamp())}"
        return mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "account_status": "deleted",
                "username": f"已注销用户_{str(user_id)[-6:]}",
                "phone": anonymized_phone,
                "password_hash": "",
                "addresses": [],
                "hearing_profile": None,
                "notification_settings": {},
                "anonymized_at": now
            },
             "$unset": {
                "email": "",
                "email_verified": "",
                "deletion_requested_at": "",
                "deletion_cooling_until": ""
            }}
        )

    @staticmethod
    def find_expired_deletions():
        now = datetime.now()
        return list(mongo.db.users.find(
            {"account_status": "pending_deletion", "deletion_cooling_until": {"$lte": now}}
        ))

    @staticmethod
    def export_user_data(user_id):
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None
        exported = {}
        safe_fields = ["username", "phone", "email", "created_at", "role",
                       "addresses", "notification_settings"]
        for key in safe_fields:
            val = user.get(key)
            if isinstance(val, datetime):
                val = val.isoformat()
            exported[key] = val
        hearing = user.get("hearing_profile")
        if isinstance(hearing, dict):
            hearing = dict(hearing)
            for k, v in hearing.items():
                if isinstance(v, datetime):
                    hearing[k] = v.isoformat()
        exported["hearing_profile"] = hearing
        try:
            cart_items = list(mongo.db.cart.find({"user_id": ObjectId(user_id)}))
            exported["cart_items"] = [{k: str(v) if isinstance(v, ObjectId) else v
                                        for k, v in item.items() if k != "_id"}
                                       for item in cart_items]
        except Exception:
            exported["cart_items"] = []
        try:
            orders = list(mongo.db.orders.find({"user_id": ObjectId(user_id)}))
            exported["orders"] = []
            for o in orders:
                entry = {}
                for k, v in o.items():
                    if k == "_id":
                        entry["order_id"] = str(v)
                    elif isinstance(v, ObjectId):
                        entry[k] = str(v)
                    elif isinstance(v, datetime):
                        entry[k] = v.isoformat()
                    else:
                        entry[k] = v
                exported["orders"].append(entry)
        except Exception:
            exported["orders"] = []
        return exported
