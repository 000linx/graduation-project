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

def create_app(config_name='default'):
    """
    应用工厂函数，用于创建和配置 Flask 应用实例
    :param config_name: 配置名称 (development, production, default)
    :return: 配置好的 Flask 应用实例
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
    
    # 配置日志记录
    setup_logger(app)
    
    # 初始化扩展
    init_extensions(app)
    
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
    
    # 注册蓝图并指定 URL 前缀
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(product_bp, url_prefix='/api/product')
    app.register_blueprint(order_bp, url_prefix='/api/order')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(payment_bp, url_prefix='/api/payment')
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
