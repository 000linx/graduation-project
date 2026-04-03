from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity
from datetime import timedelta

class JwtUtil:
    """
    JWT 工具类，用于生成和解析 Token
    """
    @staticmethod
    def create_tokens(user_id):
        """
        为用户生成 Access Token 和 Refresh Token
        :param user_id: 用户 ID
        :return: 包含 tokens 的字典
        """
        # Access Token 有效期 2 小时
        access_token = create_access_token(identity=str(user_id), expires_delta=timedelta(hours=2))
        # Refresh Token 有效期 30 天
        refresh_token = create_refresh_token(identity=str(user_id), expires_delta=timedelta(days=30))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    @staticmethod
    def get_current_user_id():
        """
        获取当前请求的用户 ID (从 JWT 中提取)
        :return: 用户 ID 字符串
        """
        return get_jwt_identity()
