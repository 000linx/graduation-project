import os
from flask import Flask, send_from_directory
from .config import config
from .extensions import init_extensions
from .utils.log_util import setup_logger

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

    if os.path.isdir(frontend_dist_dir):
        @app.get("/")
        def frontend_index():
            return send_from_directory(frontend_dist_dir, "index.html")

        @app.get("/<path:path>")
        def frontend_spa(path: str):
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
    
    # 注册蓝图并指定 URL 前缀
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(product_bp, url_prefix='/api/product')
    app.register_blueprint(order_bp, url_prefix='/api/order')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(payment_bp, url_prefix='/api/payment')
