from ..extensions import mongo
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from datetime import datetime

class User:
    """
    用户数据模型，负责用户数据的 CRUD 操作
    """
    @staticmethod
    def create(username, email, password):
        """
        创建新用户
        :param username: 用户名
        :param email: 邮箱
        :param password: 明文密码
        :return: 新用户的 ObjectId
        """
        user_data = {
            "username": username,
            "email": email,
            "password_hash": generate_password_hash(password),
            "created_at": datetime.utcnow()
        }
        
        result = mongo.db.users.insert_one(user_data)
        return result.inserted_id

    @staticmethod
    def find_by_email(email):
        """
        根据邮箱查找用户
        :param email: 邮箱
        :return: 用户文档或 None
        """
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
    def verify_password(stored_hash, password):
        """
        验证密码
        :param stored_hash: 存储的密码哈希值
        :param password: 输入的明文密码
        :return: 布尔值，是否匹配
        """
        return check_password_hash(stored_hash, password)
