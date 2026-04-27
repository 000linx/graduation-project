"""
JWT 工具封装。

职责：
- 生成 Access Token / Refresh Token
- 从当前请求上下文解析用户身份（user_id）

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- flask-jwt-extended: create_access_token/create_refresh_token/get_jwt_identity
"""

from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity
from datetime import timedelta

class JwtUtil:
    """
    JWT 工具类，用于生成和解析 Token
    """
    @staticmethod
    def create_tokens(user_id):
        """
        为用户生成 Access Token 和 Refresh Token。

        Args:
            user_id: 用户 ID（ObjectId 或其字符串形式）。

        Returns:
            dict: {"access_token": str, "refresh_token": str}

        Raises:
            Exception: 当 JWT 扩展未正确初始化或参数不合法时可能抛出。
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
        获取当前请求的用户 ID（从 JWT 中提取）。

        Returns:
            str | None: 用户 ID 字符串；若未携带 token 则为 None。

        Raises:
            Exception: 当在无请求上下文或 token 无效时，flask-jwt-extended 可能抛出异常。
        """
        return get_jwt_identity()
