"""
应用配置（按环境区分）。

职责：
- 通过环境变量读取基础配置（MongoDB/JWT/Redis/密钥等）
- 提供 development/production/default 的配置映射

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- os.environ
"""

import os

class Config:
    """
    基础配置类
    """
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-me-please-32bytes')  # 应用密钥
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/hearing_aid_mall')  # MongoDB 连接 URI
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-key-change-me-please-32bytes')  # JWT 签名密钥
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')  # Redis 连接 URL
    ADMIN_BOOTSTRAP_SECRET = os.getenv('ADMIN_BOOTSTRAP_SECRET')
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')
    
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
