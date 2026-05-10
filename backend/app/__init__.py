"""
后端应用包入口（Flask App Factory）。

职责：
- 提供 create_app 应用工厂与蓝图注册
- 统一错误处理与 JWT 处理器注册
- 可选：在存在 frontend/dist 时提供 SPA 静态资源托管

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Flask
- Flask-JWT-Extended
- MongoDB (PyMongo)
- Redis（用于 token blocklist 与缓存）
"""

import os
from flask import Flask, abort, request, send_from_directory
from werkzeug.exceptions import HTTPException
from bson.errors import InvalidId
from pymongo.errors import PyMongoError
from redis.exceptions import RedisError
from .config import config
from .extensions import init_extensions
from .extensions import jwt
from . import extensions
from .utils.log_util import setup_logger
from .utils.response import ApiResponse
from .utils.errors import AppError


def _register_static_products(app):
    products_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'products')

    if not os.path.isdir(products_dir):
        return

    @app.route('/static/products/<path:filename>')
    def serve_product_image(filename):
        return send_from_directory(products_dir, filename)


def create_app(config_name='default'):
    """
    应用工厂函数：创建并配置 Flask 应用实例。

    Args:
        config_name: 配置名称（development/production/default）。

    Returns:
        Flask: 配置完成的 Flask 应用实例。

    Raises:
        KeyError: 当 config_name 不存在于配置映射中时可能抛出。
    """
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    frontend_dist_dir = os.path.join(project_root, "frontend", "dist")
    frontend_assets_dir = os.path.join(frontend_dist_dir, "assets")

    if os.path.isdir(frontend_assets_dir):
        app = Flask(
            __name__,
            static_folder=frontend_assets_dir,
            static_url_path="/assets",
            template_folder=frontend_dist_dir
        )
    else:
        app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(config[config_name])

    if config_name == "production":
        sk = str(app.config.get("SECRET_KEY") or "")
        if not sk or sk.startswith("dev-") or "change-me" in sk:
            raise RuntimeError("SECRET_KEY must be set in production")
        jk = str(app.config.get("JWT_SECRET_KEY") or "")
        if not jk or jk.startswith("dev-") or "change-me" in jk:
            raise RuntimeError("JWT_SECRET_KEY must be set in production")
        if str(app.config.get("CORS_ORIGINS", "*")).strip() == "*":
            raise RuntimeError("CORS_ORIGINS must be restricted in production")
    
    # 配置日志记录
    setup_logger(app)
    
    # 初始化扩展
    init_extensions(app)

    # 注册产品图片静态资源路由
    _register_static_products(app)

    try:
        from .models.user_model import User
        User.ensure_indexes()
    except Exception:
        pass

    try:
        from .services.maintenance_service import MaintenanceService
        MaintenanceService.ensure_indexes()
    except Exception:
        pass

    try:
        from .services.activity_service import ActivityService
        ActivityService.ensure_indexes()
    except Exception:
        pass

    try:
        from .models.device_model import DeviceModel
        DeviceModel.ensure_indexes()
    except Exception:
        pass

    try:
        from .services.deletion_scheduler import init_deletion_scheduler
        init_deletion_scheduler(app)
    except Exception:
        pass

    # 注册蓝图 (Blueprints)
    register_blueprints(app)
    register_error_handlers(app)
    register_jwt_handlers()

    if os.path.isdir(frontend_dist_dir):
        @app.get("/")
        def frontend_index():
            return send_from_directory(frontend_dist_dir, "index.html")

        @app.get("/<path:path>")
        def frontend_spa(path: str):
            if path == "api" or path.startswith("api/"):
                abort(404)
            full_path = os.path.join(frontend_dist_dir, path)
            if os.path.isfile(full_path):
                return send_from_directory(frontend_dist_dir, path)
            return send_from_directory(frontend_dist_dir, "index.html")
    
    return app

def register_blueprints(app):
    """
    注册所有 API 蓝图
    :param app: Flask 应用实例
    """
    from .routes.user import user_bp
    from .routes.product import product_bp
    from .routes.order import order_bp
    from .routes.cart import cart_bp
    from .routes.search import search_bp
    from .routes.payment import payment_bp
    from .routes.admin import admin_bp
    from .routes.maintenance import maintenance_bp
    from .routes.activity import activity_bp
    from .routes.device import device_bp
    
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(device_bp, url_prefix='/api/user/devices')
    app.register_blueprint(product_bp, url_prefix='/api/product')
    app.register_blueprint(order_bp, url_prefix='/api/order')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(payment_bp, url_prefix='/api/payment')
    app.register_blueprint(maintenance_bp, url_prefix="/api/maintenance")
    app.register_blueprint(activity_bp, url_prefix="/api/activity")
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

def register_error_handlers(app: Flask):
    @app.errorhandler(HTTPException)
    def handle_http_exception(e: HTTPException):
        if request.path.startswith("/api/"):
            return ApiResponse.error(e.description, code=e.code or 500)
        return e

    @app.errorhandler(InvalidId)
    def handle_invalid_id(e: InvalidId):
        if request.path.startswith("/api/"):
            return ApiResponse.error("Invalid id", code=400)
        return ApiResponse.error("Invalid id", code=400)

    @app.errorhandler(PyMongoError)
    def handle_pymongo_error(e: PyMongoError):
        app.logger.exception("Database error: %s", e)
        if request.path.startswith("/api/"):
            return ApiResponse.error("Database error", code=500)
        return ApiResponse.error("Database error", code=500)

    @app.errorhandler(AppError)
    def handle_app_error(e: AppError):
        data = e.data
        if e.error_code:
            if isinstance(data, dict):
                data = {**data, "error_code": e.error_code}
            elif data is None:
                data = {"error_code": e.error_code}
        if request.path.startswith("/api/"):
            return ApiResponse.error(e.message, code=e.status_code, data=data)
        return ApiResponse.error(e.message, code=e.status_code, data=data)

    @app.errorhandler(RedisError)
    def handle_redis_error(e: RedisError):
        app.logger.exception("Redis error: %s", e)
        if request.path.startswith("/api/"):
            return ApiResponse.error("Cache error", code=500)
        return ApiResponse.error("Cache error", code=500)

    @app.errorhandler(Exception)
    def handle_unexpected_error(e: Exception):
        app.logger.exception("Unhandled exception: %s", e)
        message = str(e) if app.config.get("DEBUG") else "Internal Server Error"
        if request.path.startswith("/api/"):
            return ApiResponse.error(message, code=500)
        return message, 500

def register_jwt_handlers():
    @jwt.token_in_blocklist_loader
    def token_in_blocklist(jwt_header, jwt_payload):
        try:
            jti = jwt_payload.get("jti")
            if not jti or extensions.redis_client is None:
                return False
            return bool(extensions.redis_client.get(f"bl:{jti}"))
        except Exception:
            return False

    @jwt.unauthorized_loader
    def handle_missing_token(reason: str):
        return ApiResponse.unauthorized(reason)

    @jwt.invalid_token_loader
    def handle_invalid_token(reason: str):
        return ApiResponse.unauthorized(reason)

    @jwt.expired_token_loader
    def handle_expired_token(jwt_header, jwt_payload):
        return ApiResponse.unauthorized("Token has expired")

    @jwt.needs_fresh_token_loader
    def handle_needs_fresh_token(jwt_header, jwt_payload):
        return ApiResponse.unauthorized("Fresh token required")

    @jwt.revoked_token_loader
    def handle_revoked_token(jwt_header, jwt_payload):
        return ApiResponse.unauthorized("Token has been revoked")
