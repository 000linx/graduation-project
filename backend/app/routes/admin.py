"""
管理端 API 路由入口（/api/admin）。

职责：
- 将 admin_v2 蓝图导出供应用工厂注册

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- app.admin_v2.blueprint.admin_bp
"""

from ..admin_v2.blueprint import admin_bp
