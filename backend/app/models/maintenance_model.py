from __future__ import annotations

from datetime import datetime
from bson import ObjectId

from ..extensions import mongo


class MaintenanceAppointment:
    COL = "maintenance_appointments"

    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"
    STATUS_REJECTED = "rejected"

    ACTIVE_STATUSES = [STATUS_PENDING, STATUS_CONFIRMED]

    @staticmethod
    def ensure_indexes():
        try:
            mongo.db[MaintenanceAppointment.COL].create_index([("user_id", 1), ("created_at", -1)])
        except Exception:
            pass
        try:
            mongo.db[MaintenanceAppointment.COL].create_index([("status", 1), ("scheduled_start", 1)])
        except Exception:
            pass
        try:
            mongo.db[MaintenanceAppointment.COL].create_index([("scheduled_start", 1), ("scheduled_end", 1)])
        except Exception:
            pass
        try:
            mongo.db[MaintenanceAppointment.COL].create_index(
                [("scheduled_start", 1)],
                unique=True,
                partialFilterExpression={"status": {"$in": MaintenanceAppointment.ACTIVE_STATUSES}},
            )
        except Exception:
            pass
        try:
            mongo.db[MaintenanceAppointment.COL].create_index([("order_id", 1), ("created_at", -1)])
        except Exception:
            pass

    @staticmethod
    def find_overlaps(start: datetime, end: datetime, exclude_id: str | None = None):
        q = {
            "status": {"$in": MaintenanceAppointment.ACTIVE_STATUSES},
            "scheduled_start": {"$lt": end},
            "scheduled_end": {"$gt": start},
        }
        if exclude_id:
            q["_id"] = {"$ne": ObjectId(exclude_id)}
        return list(mongo.db[MaintenanceAppointment.COL].find(q, projection={"_id": 1, "scheduled_start": 1, "scheduled_end": 1, "status": 1}))

    @staticmethod
    def find_user_overlaps(user_id: str, start: datetime, end: datetime, exclude_id: str | None = None):
        q = {
            "user_id": ObjectId(user_id),
            "status": {"$in": MaintenanceAppointment.ACTIVE_STATUSES},
            "scheduled_start": {"$lt": end},
            "scheduled_end": {"$gt": start},
        }
        if exclude_id:
            q["_id"] = {"$ne": ObjectId(exclude_id)}
        return list(mongo.db[MaintenanceAppointment.COL].find(q, projection={"_id": 1, "scheduled_start": 1, "scheduled_end": 1, "status": 1}))

    @staticmethod
    def create(doc: dict):
        now = datetime.now()
        doc = dict(doc)
        doc.setdefault("created_at", now)
        doc.setdefault("updated_at", now)
        doc.setdefault("version", 1)
        return mongo.db[MaintenanceAppointment.COL].insert_one(doc).inserted_id

    @staticmethod
    def get(appointment_id: str):
        return mongo.db[MaintenanceAppointment.COL].find_one({"_id": ObjectId(appointment_id)})

    @staticmethod
    def list_by_user(user_id: str, page: int, page_size: int):
        q = {"user_id": ObjectId(user_id)}
        total = mongo.db[MaintenanceAppointment.COL].count_documents(q)
        cursor = (
            mongo.db[MaintenanceAppointment.COL]
            .find(q)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        return list(cursor), total

    @staticmethod
    def update(appointment_id: str, updates: dict, expected_statuses: list[str] | None = None):
        q = {"_id": ObjectId(appointment_id)}
        if expected_statuses is not None:
            q["status"] = {"$in": expected_statuses}
        updates = dict(updates)
        updates["updated_at"] = datetime.now()
        return mongo.db[MaintenanceAppointment.COL].update_one(q, {"$set": updates, "$inc": {"version": 1}})


class MaintenanceRecord:
    COL = "maintenance_records"

    @staticmethod
    def ensure_indexes():
        try:
            mongo.db[MaintenanceRecord.COL].create_index([("user_id", 1), ("created_at", -1)])
        except Exception:
            pass
        try:
            mongo.db[MaintenanceRecord.COL].create_index([("appointment_id", 1)], unique=True)
        except Exception:
            pass

    @staticmethod
    def create(doc: dict):
        doc = dict(doc)
        doc.setdefault("created_at", datetime.now())
        return mongo.db[MaintenanceRecord.COL].insert_one(doc).inserted_id

    @staticmethod
    def get(record_id: str):
        return mongo.db[MaintenanceRecord.COL].find_one({"_id": ObjectId(record_id)})

    @staticmethod
    def get_by_appointment(appointment_id: str):
        return mongo.db[MaintenanceRecord.COL].find_one({"appointment_id": ObjectId(appointment_id)})

    @staticmethod
    def list_by_user(user_id: str, page: int, page_size: int):
        q = {"user_id": ObjectId(user_id)}
        total = mongo.db[MaintenanceRecord.COL].count_documents(q)
        cursor = (
            mongo.db[MaintenanceRecord.COL]
            .find(q)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        return list(cursor), total

