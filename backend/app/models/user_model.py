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
