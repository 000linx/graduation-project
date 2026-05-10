from __future__ import annotations

import json
import os
import sys
import time

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app  # noqa: E402
from app.models.user_model import User  # noqa: E402


def main():
    stamp = str(int(time.time()))
    admin_phone = f"1399{stamp[-7:]}"
    user_phone = f"1389{stamp[-7:]}"
    admin_password = "Passw0rd!test"
    user_password = "Passw0rd!test"

    app = create_app("development")
    with app.app_context():
        if not User.find_by_phone(admin_phone):
            User.create(username=f"itest_admin_{stamp}", phone=admin_phone, password=admin_password, role="admin")
        if not User.find_by_phone(user_phone):
            User.create(username=f"itest_user_{stamp}", phone=user_phone, password=user_password, role="user")

    out = {
        "admin": {"phone": admin_phone, "password": admin_password},
        "user": {"phone": user_phone, "password": user_password},
        "shipping_address": "上海市 测试路 1 号",
    }
    sys.stdout.write(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()

