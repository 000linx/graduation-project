import os
import sys

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app

# 创建应用实例，默认使用 default 配置
app = create_app(os.getenv('FLASK_CONFIG', 'default'))

if __name__ == '__main__':
    # 启动应用，监听所有网络接口，端口 5000
    app.run(host='127.0.0.1', port=5000)
