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
    初始化所有 Flask 扩展
    :param app: Flask 应用实例
    """
    mongo.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    
    # 初始化 Redis 客户端
    global redis_client
    redis_client = redis.from_url(app.config['REDIS_URL'])
