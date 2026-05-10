"""
Flask 扩展初始化与全局实例。

职责：
- 初始化 MongoDB（PyMongo）、JWT（Flask-JWT-Extended）、CORS
- 按需初始化 Redis 客户端（用于缓存与 token blocklist）

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- flask-pymongo
- flask-jwt-extended
- flask-cors
- redis-py
"""

from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import redis

# 初始化扩展对象
mongo = PyMongo()
jwt = JWTManager()
cors = CORS()
redis_client = None

def init_extensions(app):
    """
    初始化所有 Flask 扩展。

    Args:
        app: Flask 应用实例。

    Returns:
        None

    Raises:
        Exception: 初始化 Redis 时会捕获异常并降级为未启用（不向外抛出）。
    """
    mongo.init_app(app)
    jwt.init_app(app)
    origins_raw = app.config.get("CORS_ORIGINS", "*")
    origins = origins_raw
    if isinstance(origins_raw, str) and origins_raw.strip() != "*":
        origins = [x.strip() for x in origins_raw.split(",") if x.strip()]
    cors.init_app(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)
    
    # 初始化 Redis 客户端
    global redis_client
    redis_url = app.config.get("REDIS_URL")
    if not redis_url:
        redis_client = None
        return
    try:
        client = redis.from_url(redis_url)
        # 启动时做一次 ping，确保连接可用；失败则降级为不启用 Redis
        client.ping()
        redis_client = client
    except Exception:
        redis_client = None
