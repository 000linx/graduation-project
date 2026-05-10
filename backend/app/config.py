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
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')

    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_ACCESS_COOKIE_NAME = os.getenv("JWT_ACCESS_COOKIE_NAME", "access_token_cookie")
    JWT_REFRESH_COOKIE_NAME = os.getenv("JWT_REFRESH_COOKIE_NAME", "refresh_token_cookie")
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_CSRF_IN_COOKIES = True
    JWT_ACCESS_CSRF_COOKIE_NAME = os.getenv("JWT_ACCESS_CSRF_COOKIE_NAME", "csrf_access_token")
    JWT_REFRESH_CSRF_COOKIE_NAME = os.getenv("JWT_REFRESH_CSRF_COOKIE_NAME", "csrf_refresh_token")
    JWT_ACCESS_CSRF_HEADER_NAME = "X-CSRF-TOKEN"
    JWT_REFRESH_CSRF_HEADER_NAME = "X-CSRF-TOKEN"
    JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_DOMAIN = os.getenv("JWT_COOKIE_DOMAIN") or None
    JWT_SESSION_COOKIE = False
    
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
    JWT_COOKIE_SECURE = True

# 配置映射字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
