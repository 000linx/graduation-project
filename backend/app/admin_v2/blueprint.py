"""
管理员模块蓝图入口（/api/admin）。

对外导出 admin_bp，并在导入时完成路由注册。
"""

from flask import Blueprint

from .controllers import register_admin_routes


admin_bp = Blueprint("admin", __name__)
register_admin_routes(admin_bp)
