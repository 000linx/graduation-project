import os

class Config:
    """
    基础配置类
    """
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')  # 应用密钥
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/hearing_aid_mall')  # MongoDB 连接 URI
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')  # JWT 签名密钥
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')  # Redis 连接 URL
    ADMIN_BOOTSTRAP_SECRET = os.getenv('ADMIN_BOOTSTRAP_SECRET')
    
class DevelopmentConfig(Config):
    """
    开发环境配置
    """
    DEBUG = True

class ProductionConfig(Config):
    """
    生产环境配置
    """
    DEBUG = False

# 配置映射字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
