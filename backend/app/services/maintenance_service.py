from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Any

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from .. import extensions
from ..extensions import mongo
from ..models.maintenance_model import MaintenanceAppointment, MaintenanceRecord
from ..models.user_model import User
from ..utils.distributed_lock import DistributedLock, backoff_sleep
from ..utils.errors import AppError, ConflictError, ForbiddenError, NotFoundError, ValidationError


def _parse_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        raise ValidationError("Invalid date format, expected YYYY-MM-DD")


def _parse_local_datetime(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except Exception:
        raise ValidationError("Invalid datetime format, expected ISO-8601")


def _round_up(dt: datetime, minutes: int) -> datetime:
    delta = timedelta(minutes=minutes)
    epoch = datetime(dt.year, dt.month, dt.day)
    offset = dt - epoch
    steps = int((offset.total_seconds() + delta.total_seconds() - 1) // delta.total_seconds())
    return epoch + steps * delta


@dataclass(frozen=True)
class Slot:
    start: datetime
    end: datetime
    score: float


class MaintenanceService:
    SLOT_MINUTES = 30
    WORK_START = time(9, 0)
    WORK_END = time(18, 0)
    LUNCH_START = time(12, 0)
    LUNCH_END = time(13, 0)

    @staticmethod
    def ensure_indexes():
        MaintenanceAppointment.ensure_indexes()
        MaintenanceRecord.ensure_indexes()
        try:
            mongo.db["user_notifications"].create_index([("user_id", 1), ("created_at", -1)])
        except Exception:
            pass

    @staticmethod
    def _require_purchased(user_id: str, order_id: str | None):
        q: dict[str, Any] = {"user_id": ObjectId(user_id), "status": {"$in": ["paid", "completed", "delivered", "shipped"]}}
        if order_id:
            q["_id"] = ObjectId(order_id)
        order = mongo.db.orders.find_one(q, projection={"_id": 1, "items": 1, "status": 1})
        if not order:
            raise ForbiddenError("Only users with purchased orders can book maintenance")
        return order

    @staticmethod
    def list_eligible_orders(user_id: str):
        cursor = mongo.db.orders.find(
            {"user_id": ObjectId(user_id), "status": {"$in": ["paid", "completed", "delivered", "shipped"]}},
            projection={"items": 1, "status": 1, "created_at": 1, "total_amount": 1},
        ).sort("created_at", -1)
        out = []
        for o in cursor:
            items = o.get("items") or []
            normalized = []
            for it in items:
                if not isinstance(it, dict):
                    continue
                normalized.append(
                    {
                        "product_id": str(it.get("product_id")) if it.get("product_id") is not None else None,
                        "name": it.get("name"),
                        "quantity": it.get("quantity"),
                        "price": it.get("price"),
                    }
                )
            out.append(
                {
                    "order_id": str(o["_id"]),
                    "status": o.get("status"),
                    "created_at": o.get("created_at"),
                    "total_amount": o.get("total_amount"),
                    "items": normalized,
                }
            )
        return out

    @staticmethod
    def _get_busy_intervals(day_value: date):
        day_start = datetime.combine(day_value, time(0, 0, 0))
        day_end = day_start + timedelta(days=1)
        q = {
            "status": {"$in": MaintenanceAppointment.ACTIVE_STATUSES},
            "scheduled_start": {"$lt": day_end},
            "scheduled_end": {"$gt": day_start},
        }
        cursor = mongo.db[MaintenanceAppointment.COL].find(q, projection={"scheduled_start": 1, "scheduled_end": 1})
        out = []
        for d in cursor:
            s = d.get("scheduled_start")
            e = d.get("scheduled_end")
            if isinstance(s, datetime) and isinstance(e, datetime):
                out.append((s, e))
        return out

    @staticmethod
    def recommend_slots(day_str: str, limit: int = 12):
        d = _parse_date(day_str)
        busy = MaintenanceService._get_busy_intervals(d)

        start = datetime.combine(d, MaintenanceService.WORK_START)
        end = datetime.combine(d, MaintenanceService.WORK_END)
        lunch_s = datetime.combine(d, MaintenanceService.LUNCH_START)
        lunch_e = datetime.combine(d, MaintenanceService.LUNCH_END)

        now = datetime.now() + timedelta(minutes=10)
        cursor = _round_up(max(start, now), MaintenanceService.SLOT_MINUTES)

        slots: list[Slot] = []
        while cursor + timedelta(minutes=MaintenanceService.SLOT_MINUTES) <= end:
            nxt = cursor + timedelta(minutes=MaintenanceService.SLOT_MINUTES)
            if cursor < lunch_e and nxt > lunch_s:
                cursor = lunch_e
                continue

            overlap = False
            for bs, be in busy:
                if bs < nxt and be > cursor:
                    overlap = True
                    break
            if not overlap:
                score = 1.0
                if cursor.hour < 10:
                    score += 0.2
                if cursor.weekday() >= 5:
                    score -= 0.3
                slots.append(Slot(start=cursor, end=nxt, score=score))
            cursor = nxt

        slots.sort(key=lambda s: (-s.score, s.start))
        return [{"start": s.start.isoformat(timespec="minutes"), "end": s.end.isoformat(timespec="minutes"), "score": s.score} for s in slots[: max(1, min(limit, 48))]]

    @staticmethod
    def _notify_user(user_id: str, title: str, message: str, data: dict | None = None):
        settings = User.get_notification_settings(user_id)
        if not settings.get("in_app_notifications", True):
            return False
        try:
            mongo.db["user_notifications"].insert_one(
                {
                    "user_id": ObjectId(user_id),
                    "title": title,
                    "message": message,
                    "data": data or {},
                    "read": False,
                    "created_at": datetime.now(),
                }
            )
            return True
        except Exception:
            return False

    @staticmethod
    def create_appointment(
        user_id: str,
        order_id: str | None,
        product_id: str | None,
        contact_name: str,
        contact_phone: str,
        preferred_start_iso: str,
        notes: str | None = None,
    ):
        if not contact_name or not contact_phone:
            raise ValidationError("contact_name and contact_phone required")
        preferred_start = _parse_local_datetime(preferred_start_iso)
        preferred_end = preferred_start + timedelta(minutes=MaintenanceService.SLOT_MINUTES)

        if preferred_start.second != 0 or preferred_start.microsecond != 0 or (preferred_start.minute % MaintenanceService.SLOT_MINUTES) != 0:
            raise ValidationError("preferred_start must align to 30-minute slot")

        day = preferred_start.date()
        if preferred_start < datetime.combine(day, MaintenanceService.WORK_START) or preferred_end > datetime.combine(day, MaintenanceService.WORK_END):
            raise ValidationError("preferred_start out of working hours")
        lunch_s = datetime.combine(day, MaintenanceService.LUNCH_START)
        lunch_e = datetime.combine(day, MaintenanceService.LUNCH_END)
        if preferred_start < lunch_e and preferred_end > lunch_s:
            raise ValidationError("preferred_start conflicts with lunch break")

        if preferred_start < datetime.now() + timedelta(minutes=10):
            raise ValidationError("Appointment time too soon")

        MaintenanceService._require_purchased(user_id, order_id)

        lock = DistributedLock(extensions.redis_client)
        lock_key = f"maintenance:slot:{preferred_start.isoformat(timespec='minutes')}"

        token = None
        if lock.redis is not None:
            for attempt in range(6):
                token = lock.acquire(lock_key, ttl_ms=5000)
                if token:
                    break
                backoff_sleep(attempt)

        try:
            overlaps = MaintenanceAppointment.find_overlaps(preferred_start, preferred_end)
            if overlaps:
                raise ConflictError("Time slot already booked")
            user_overlaps = MaintenanceAppointment.find_user_overlaps(user_id, preferred_start, preferred_end)
            if user_overlaps:
                raise ConflictError("You already have an appointment in this time range")

            doc = {
                "user_id": ObjectId(user_id),
                "order_id": ObjectId(order_id) if order_id else None,
                "product_id": product_id,
                "contact_name": contact_name,
                "contact_phone": contact_phone,
                "notes": notes or "",
                "timezone": "Asia/Shanghai",
                "preferred_start": preferred_start,
                "preferred_end": preferred_end,
                "scheduled_start": preferred_start,
                "scheduled_end": preferred_end,
                "status": MaintenanceAppointment.STATUS_PENDING,
                "admin": {},
            }
            doc = {k: v for k, v in doc.items() if v is not None}
            try:
                appointment_id = MaintenanceAppointment.create(doc)
            except DuplicateKeyError:
                raise ConflictError("Time slot already booked")

            MaintenanceService._notify_user(
                user_id,
                "保养预约已提交",
                "你的保养预约已提交，等待管理员确认。",
                {"appointment_id": str(appointment_id)},
            )
            return str(appointment_id)
        finally:
            if token:
                lock.release(lock_key, token)

    @staticmethod
    def cancel_appointment(user_id: str, appointment_id: str, reason: str | None = None):
        appt = MaintenanceAppointment.get(appointment_id)
        if not appt:
            raise NotFoundError("Appointment not found")
        if str(appt.get("user_id")) != str(user_id):
            raise ForbiddenError("Forbidden")
        if appt.get("status") in [MaintenanceAppointment.STATUS_COMPLETED, MaintenanceAppointment.STATUS_CANCELLED]:
            raise ValidationError("Appointment cannot be cancelled")
        res = mongo.db[MaintenanceAppointment.COL].update_one(
            {"_id": ObjectId(appointment_id), "user_id": ObjectId(user_id), "status": {"$in": [MaintenanceAppointment.STATUS_PENDING, MaintenanceAppointment.STATUS_CONFIRMED]}},
            {"$set": {"status": MaintenanceAppointment.STATUS_CANCELLED, "cancel_reason": reason or "", "updated_at": datetime.now()}},
        )
        if res.modified_count <= 0:
            raise AppError("Cancel failed", 409)
        MaintenanceService._notify_user(user_id, "保养预约已取消", "你的保养预约已取消。", {"appointment_id": appointment_id})
        return True

    @staticmethod
    def update_appointment(user_id: str, appointment_id: str, contact_name: str | None, contact_phone: str | None, notes: str | None):
        appt = MaintenanceAppointment.get(appointment_id)
        if not appt:
            raise NotFoundError("Appointment not found")
        if str(appt.get("user_id")) != str(user_id):
            raise ForbiddenError("Forbidden")
        if appt.get("status") != MaintenanceAppointment.STATUS_PENDING:
            raise ValidationError("Only pending appointment can be edited")
        updates = {}
        if contact_name is not None:
            updates["contact_name"] = contact_name
        if contact_phone is not None:
            updates["contact_phone"] = contact_phone
        if notes is not None:
            updates["notes"] = notes
        if not updates:
            return False
        updates["updated_at"] = datetime.now()
        mongo.db[MaintenanceAppointment.COL].update_one({"_id": ObjectId(appointment_id), "user_id": ObjectId(user_id)}, {"$set": updates})
        return True

    @staticmethod
    def list_user_appointments(user_id: str, page: int, page_size: int):
        return MaintenanceAppointment.list_by_user(user_id, page, page_size)

    @staticmethod
    def list_user_records(user_id: str, page: int, page_size: int):
        return MaintenanceRecord.list_by_user(user_id, page, page_size)

    @staticmethod
    def admin_list_appointments(
        user_id: str | None,
        status: str | None,
        start_iso: str | None,
        end_iso: str | None,
        page: int,
        page_size: int,
    ):
        q: dict[str, Any] = {}
        if user_id:
            q["user_id"] = ObjectId(user_id)
        if status:
            q["status"] = status
        if start_iso or end_iso:
            rng: dict[str, Any] = {}
            if start_iso:
                rng["$gte"] = _parse_local_datetime(start_iso)
            if end_iso:
                rng["$lte"] = _parse_local_datetime(end_iso)
            q["scheduled_start"] = rng

        total = mongo.db[MaintenanceAppointment.COL].count_documents(q)
        cursor = (
            mongo.db[MaintenanceAppointment.COL]
            .find(q)
            .sort("scheduled_start", 1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        return list(cursor), total

    @staticmethod
    def admin_get_detail(appointment_id: str):
        appt = MaintenanceAppointment.get(appointment_id)
        if not appt:
            raise NotFoundError("Appointment not found")
        history, _ = MaintenanceRecord.list_by_user(str(appt["user_id"]), page=1, page_size=20)
        record = MaintenanceRecord.get_by_appointment(appointment_id)
        return appt, history, record

    @staticmethod
    def _admin_transition(appointment_id: str, expected: list[str], new_status: str, updates: dict):
        q = {"_id": ObjectId(appointment_id), "status": {"$in": expected}}
        updates = dict(updates)
        updates["status"] = new_status
        updates["updated_at"] = datetime.now()
        res = mongo.db[MaintenanceAppointment.COL].update_one(q, {"$set": updates})
        if res.modified_count <= 0:
            raise AppError("State transition failed", 409)
        appt = MaintenanceAppointment.get(appointment_id)
        return appt

    @staticmethod
    def admin_confirm(appointment_id: str, admin_user_id: str):
        appt = MaintenanceService._admin_transition(
            appointment_id,
            expected=[MaintenanceAppointment.STATUS_PENDING],
            new_status=MaintenanceAppointment.STATUS_CONFIRMED,
            updates={"admin.confirmed_by": ObjectId(admin_user_id), "admin.confirmed_at": datetime.now()},
        )
        MaintenanceService._notify_user(str(appt["user_id"]), "保养预约已确认", "管理员已确认你的保养预约。", {"appointment_id": appointment_id})
        return appt

    @staticmethod
    def admin_reject(appointment_id: str, admin_user_id: str, reason: str):
        if not reason:
            raise ValidationError("reason required")
        appt = MaintenanceService._admin_transition(
            appointment_id,
            expected=[MaintenanceAppointment.STATUS_PENDING],
            new_status=MaintenanceAppointment.STATUS_REJECTED,
            updates={"admin.rejected_by": ObjectId(admin_user_id), "admin.rejected_at": datetime.now(), "reject_reason": reason},
        )
        MaintenanceService._notify_user(str(appt["user_id"]), "保养预约已拒绝", f"管理员拒绝了你的预约：{reason}", {"appointment_id": appointment_id})
        return appt

    @staticmethod
    def admin_reschedule(appointment_id: str, admin_user_id: str, new_start_iso: str):
        new_start = _parse_local_datetime(new_start_iso)
        new_end = new_start + timedelta(minutes=MaintenanceService.SLOT_MINUTES)

        if new_start.second != 0 or new_start.microsecond != 0 or (new_start.minute % MaintenanceService.SLOT_MINUTES) != 0:
            raise ValidationError("new_start must align to 30-minute slot")

        lock = DistributedLock(extensions.redis_client)
        lock_key = f"maintenance:slot:{new_start.isoformat(timespec='minutes')}"
        token = None
        if lock.redis is not None:
            for attempt in range(6):
                token = lock.acquire(lock_key, ttl_ms=5000)
                if token:
                    break
                backoff_sleep(attempt)

        try:
            overlaps = MaintenanceAppointment.find_overlaps(new_start, new_end, exclude_id=appointment_id)
            if overlaps:
                raise ConflictError("Time slot already booked")

            q = {"_id": ObjectId(appointment_id), "status": {"$in": [MaintenanceAppointment.STATUS_PENDING, MaintenanceAppointment.STATUS_CONFIRMED]}}
            update = {
                "$set": {
                    "scheduled_start": new_start,
                    "scheduled_end": new_end,
                    "admin.rescheduled_by": ObjectId(admin_user_id),
                    "admin.rescheduled_at": datetime.now(),
                    "updated_at": datetime.now(),
                }
            }
            try:
                res = mongo.db[MaintenanceAppointment.COL].update_one(q, update)
            except DuplicateKeyError:
                raise ConflictError("Time slot already booked")
            if res.modified_count <= 0:
                raise AppError("Reschedule failed", 409)

            appt = MaintenanceAppointment.get(appointment_id)
            MaintenanceService._notify_user(str(appt["user_id"]), "保养预约已改期", "管理员已为你改期，请查看最新时间。", {"appointment_id": appointment_id})
            return appt
        finally:
            if token:
                lock.release(lock_key, token)

    @staticmethod
    def admin_complete(
        appointment_id: str,
        admin_user_id: str,
        technician: dict,
        items: list[dict],
        replaced_parts: list[dict],
        total_cost: float,
        report: str,
    ):
        appt = MaintenanceAppointment.get(appointment_id)
        if not appt:
            raise NotFoundError("Appointment not found")
        if appt.get("status") != MaintenanceAppointment.STATUS_CONFIRMED:
            raise ValidationError("Only confirmed appointment can be completed")

        if MaintenanceRecord.get_by_appointment(appointment_id):
            raise ConflictError("Record already exists")

        doc = {
            "appointment_id": ObjectId(appointment_id),
            "user_id": appt.get("user_id"),
            "order_id": appt.get("order_id"),
            "product_id": appt.get("product_id"),
            "technician": technician or {},
            "items": items or [],
            "replaced_parts": replaced_parts or [],
            "total_cost": float(total_cost or 0),
            "report": report or "",
            "created_by": ObjectId(admin_user_id),
            "created_at": datetime.now(),
        }
        record_id = MaintenanceRecord.create(doc)

        MaintenanceService._admin_transition(
            appointment_id,
            expected=[MaintenanceAppointment.STATUS_CONFIRMED],
            new_status=MaintenanceAppointment.STATUS_COMPLETED,
            updates={"admin.completed_by": ObjectId(admin_user_id), "admin.completed_at": datetime.now(), "record_id": record_id},
        )
        MaintenanceService._notify_user(str(appt["user_id"]), "保养已完成", "你的保养已完成，可在历史档案中查看报告。", {"appointment_id": appointment_id, "record_id": str(record_id)})
        return record_id

    @staticmethod
    def list_notifications(user_id: str, page: int, page_size: int):
        q = {"user_id": ObjectId(user_id)}
        total = mongo.db["user_notifications"].count_documents(q)
        cursor = (
            mongo.db["user_notifications"]
            .find(q)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        return list(cursor), total

