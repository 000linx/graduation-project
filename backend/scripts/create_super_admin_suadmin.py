import os
import sys
from datetime import datetime

from bson import ObjectId
from werkzeug.security import generate_password_hash

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import mongo
from app.admin_v2.services.rbac_service import RbacService


def main():
    username = "suadmin"
    phone = "19900000000"
    password = "123456"

    app = create_app("development")
    with app.app_context():
        RbacService.ensure_defaults()
        role = mongo.db.admin_roles.find_one({"name": "super_admin"})
        if not role:
            raise RuntimeError("super_admin role not found")

        now = datetime.now()
        user = mongo.db.users.find_one({"$or": [{"username": username}, {"phone": phone}]})
        if user:
            mongo.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"username": username, "phone": phone, "password_hash": generate_password_hash(password), "role": "admin"}},
            )
            user_id = user["_id"]
        else:
            user_id = mongo.db.users.insert_one(
                {
                    "username": username,
                    "phone": phone,
                    "password_hash": generate_password_hash(password),
                    "role": "admin",
                    "rbac_version": 0,
                    "created_at": now,
                }
            ).inserted_id

        mongo.db.admin_user_roles.update_one(
            {"user_id": ObjectId(user_id)},
            {
                "$set": {"user_id": ObjectId(user_id), "role_ids": [role["_id"]], "updated_at": now},
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"rbac_version": 1}})

        print(f"OK user_id={user_id} phone={phone}")


if __name__ == "__main__":
    main()

