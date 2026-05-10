"""
用户已拥有设备模型（MongoDB）。

职责：
- 绑定/解绑用户助听器设备
- 设备列表与详情查询
- 设备状态管理（在线/离线/待维护）

Author: Graduation Project Team
Created: 2026-05-09
Dependencies:
- MongoDB collection: user_devices
"""

from ..extensions import mongo
from bson import ObjectId
from datetime import datetime


class DeviceModel:
    COLLECTION = mongo.db.user_devices if mongo.db is not None else None

    @staticmethod
    def _col():
        return mongo.db.user_devices

    @staticmethod
    def ensure_indexes():
        try:
            mongo.db.user_devices.create_index([("user_id", 1), ("serial_no", 1)], unique=True)
            mongo.db.user_devices.create_index([("user_id", 1)])
        except Exception:
            pass

    @staticmethod
    def bind_device(user_id: str, data: dict) -> dict:
        now = datetime.utcnow()
        doc = {
            "user_id": ObjectId(user_id),
            "model": str(data.get("model", "")).strip(),
            "serial_no": str(data.get("serial_no", "")).strip(),
            "purchase_date": data.get("purchase_date"),
            "warranty_end": data.get("warranty_end"),
            "thumbnail": str(data.get("thumbnail", "")),
            "status": "online",
            "firmware_version": data.get("firmware_version", "1.0.0"),
            "last_sync": None,
            "usage_stats": {
                "total_hours": 0,
                "avg_daily_hours": 0,
                "battery_cycles": 0,
                "last_7_days_hours": [0] * 7
            },
            "created_at": now,
            "updated_at": now,
        }
        result = mongo.db.user_devices.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        doc["user_id"] = str(doc["user_id"])
        return doc

    @staticmethod
    def unbind_device(user_id: str, device_id: str) -> bool:
        result = mongo.db.user_devices.delete_one({
            "_id": ObjectId(device_id),
            "user_id": ObjectId(user_id)
        })
        return result.deleted_count > 0

    @staticmethod
    def list_devices(user_id: str) -> list:
        docs = mongo.db.user_devices.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
        result = []
        for d in docs:
            d["_id"] = str(d["_id"])
            d["user_id"] = str(d["user_id"])
            result.append(d)
        return result

    @staticmethod
    def get_device(user_id: str, device_id: str) -> dict | None:
        doc = mongo.db.user_devices.find_one({
            "_id": ObjectId(device_id),
            "user_id": ObjectId(user_id)
        })
        if doc:
            doc["_id"] = str(doc["_id"])
            doc["user_id"] = str(doc["user_id"])
        return doc

    @staticmethod
    def update_device_status(device_id: str, status: str) -> bool:
        result = mongo.db.user_devices.update_one(
            {"_id": ObjectId(device_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0
