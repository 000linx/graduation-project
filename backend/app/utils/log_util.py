"""
日志配置工具。

职责：
- 为 Flask app 配置 RotatingFileHandler
- 统一日志格式与等级

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- logging
- logging.handlers.RotatingFileHandler
"""

import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logger(app):
    """
    配置应用日志记录。

    Args:
        app: Flask 应用实例。

    Returns:
        None

    Raises:
        OSError: 创建 logs 目录失败时可能抛出。
    """
    if not os.path.exists('logs'):
        os.mkdir('logs')
        
    # 创建文件处理器，设置日志文件大小限制和备份数量
    file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
    
    # 设置日志格式
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    
    # 设置应用日志级别
    app.logger.setLevel(logging.INFO)
    app.logger.info('App startup')
