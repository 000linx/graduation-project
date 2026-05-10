from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from ..extensions import mongo


class Activity:
    COL = "activities"

    STATUS_DRAFT = "draft"
    STATUS_SCHEDULED = "scheduled"
    STATUS_PUBLISHED = "published"
    STATUS_OFFLINE = "offline"

    @staticmethod
    def ensure_indexes():
        try:
            mongo.db[Activity.COL].create_index([("created_at", -1)])
        except Exception:
            pass
        try:
            mongo.db[Activity.COL].create_index([("start_at", 1)])
        except Exception:
            pass
        try:
            mongo.db[Activity.COL].create_index([("status", 1), ("publish_at", 1)])
        except Exception:
            pass
        try:
            mongo.db[Activity.COL].create_index([("name", "text"), ("subtitle", "text")])
        except Exception:
            pass

    @staticmethod
    def create(doc: dict) -> str:
        now = datetime.now()
        doc = dict(doc)
        doc.setdefault("created_at", now)
        doc.setdefault("updated_at", now)
        doc.setdefault("version", 1)
        _id = mongo.db[Activity.COL].insert_one(doc).inserted_id
        return str(_id)

    @staticmethod
    def get(activity_id: str):
        return mongo.db[Activity.COL].find_one({"_id": ObjectId(activity_id)})

    @staticmethod
    def update(activity_id: str, updates: dict):
        updates = dict(updates)
        updates["updated_at"] = datetime.now()
        return mongo.db[Activity.COL].update_one({"_id": ObjectId(activity_id)}, {"$set": updates, "$inc": {"version": 1}})


class ActivityVersion:
    COL = "activity_versions"

    @staticmethod
    def ensure_indexes():
        try:
            mongo.db[ActivityVersion.COL].create_index([("activity_id", 1), ("created_at", -1)])
        except Exception:
            pass
        try:
            mongo.db[ActivityVersion.COL].create_index([("activity_id", 1), ("version_no", -1)])
        except Exception:
            pass

    @staticmethod
    def next_version_no(activity_id: str) -> int:
        doc = mongo.db[ActivityVersion.COL].find_one({"activity_id": ObjectId(activity_id)}, sort=[("version_no", -1)], projection={"version_no": 1})
        return int((doc or {}).get("version_no") or 0) + 1

    @staticmethod
    def create(doc: dict) -> str:
        doc = dict(doc)
        doc.setdefault("created_at", datetime.now())
        _id = mongo.db[ActivityVersion.COL].insert_one(doc).inserted_id
        return str(_id)

    @staticmethod
    def list(activity_id: str, limit: int = 50):
        cur = (
            mongo.db[ActivityVersion.COL]
            .find({"activity_id": ObjectId(activity_id)}, projection={"snapshot": 0})
            .sort("created_at", -1)
            .limit(limit)
        )
        return list(cur)

    @staticmethod
    def get(version_id: str):
        return mongo.db[ActivityVersion.COL].find_one({"_id": ObjectId(version_id)})


class ActivityRegistration:
    COL = "activity_registrations"

    STATUS_PENDING = "pending"
    STATUS_PAID = "paid"
    STATUS_CANCELLED = "cancelled"

    @staticmethod
    def ensure_indexes():
        try:
            mongo.db[ActivityRegistration.COL].create_index([("activity_id", 1), ("created_at", -1)])
        except Exception:
            pass
        try:
            mongo.db[ActivityRegistration.COL].create_index([("activity_id", 1), ("user_id", 1)], unique=True)
        except Exception:
            pass
        try:
            mongo.db[ActivityRegistration.COL].create_index([("activity_id", 1), ("ticket_tier_id", 1)])
        except Exception:
            pass

    @staticmethod
    def count_by_activity(activity_id: str):
        return int(mongo.db[ActivityRegistration.COL].count_documents({"activity_id": ObjectId(activity_id), "status": {"$ne": ActivityRegistration.STATUS_CANCELLED}}))

    @staticmethod
    def count_paid_by_activity(activity_id: str):
        return int(mongo.db[ActivityRegistration.COL].count_documents({"activity_id": ObjectId(activity_id), "status": ActivityRegistration.STATUS_PAID}))

    @staticmethod
    def count_paid_by_tier(activity_id: str):
        pipeline = [
            {"$match": {"activity_id": ObjectId(activity_id), "status": ActivityRegistration.STATUS_PAID}},
            {"$group": {"_id": "$ticket_tier_id", "cnt": {"$sum": 1}}},
        ]
        out = {}
        for row in mongo.db[ActivityRegistration.COL].aggregate(pipeline):
            out[str(row["_id"])] = int(row["cnt"])
        return out

