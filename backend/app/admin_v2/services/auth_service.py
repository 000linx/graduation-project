from __future__ import annotations

"""
管理端鉴权服务（Service）。

该层负责“管理员身份”判断（JWT 身份 + user.role == admin），为 Controller 提供统一入口。
"""

from ...models.user_model import User
from ...utils.jwt_util import JwtUtil
from ...utils.errors import ForbiddenError, UnauthorizedError


class AdminAuthService:
    @staticmethod
    def get_admin_user():
        """
        获取当前请求对应的管理员用户文档。

        :raises UnauthorizedError: token 缺失/用户不存在
        :raises ForbiddenError: 非管理员用户
        :return: 用户文档（MongoDB document）
        """
        user_id = JwtUtil.get_current_user_id()
        if not user_id:
            raise UnauthorizedError("Missing identity")
        user = User.find_by_id(user_id)
        if not user:
            raise UnauthorizedError("User not found")
        if user.get("role") != "admin":
            raise ForbiddenError("Admin only")
        return user
