"""
Flask 应用启动入口（用于本地开发/调试）。

职责：
- 构建 Flask App 实例并启动 HTTP 服务

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- app.create_app（应用工厂）
"""

import os
import sys

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app

# 创建应用实例：通过环境变量 FLASK_CONFIG 选择配置，默认使用 default
app = create_app(os.getenv('FLASK_CONFIG', 'default'))

if __name__ == '__main__':
    # 启动应用：默认绑定 127.0.0.1:5000（本地开发）
    app.run(host='127.0.0.1', port=5000)
