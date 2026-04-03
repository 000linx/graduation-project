import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logger(app):
    """
    配置应用日志记录
    :param app: Flask 应用实例
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
