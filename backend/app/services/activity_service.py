from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Iterable

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from ..extensions import mongo, redis_client
from ..models.activity_model import Activity, ActivityRegistration, ActivityVersion
from ..utils.distributed_lock import DistributedLock, backoff_sleep
from ..utils.errors import AppError, ConflictError, ForbiddenError, NotFoundError, ValidationError


def _parse_dt(value: str | None, field: str) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value))
    except Exception:
        raise ValidationError(f"Invalid datetime for {field}")


def _now() -> datetime:
    return datetime.now()


def _field_paths(diff: dict) -> list[str]:
    out: list[str] = []

    def walk(prefix: str, obj: Any):
        if isinstance(obj, dict):
            for k, v in obj.items():
                p = f"{prefix}.{k}" if prefix else str(k)
                walk(p, v)
        else:
            out.append(prefix)

    walk("", diff)
    return sorted(set(out))


def _pick(d: dict, keys: Iterable[str]) -> dict:
    return {k: d.get(k) for k in keys if k in d}


def _activity_time_status(activity: dict) -> str:
    start_at = activity.get("start_at")
    end_at = activity.get("end_at")
    if not isinstance(start_at, datetime) or not isinstance(end_at, datetime):
        return "unknown"
    now = _now()
    if now < start_at:
        return "not_started"
    if start_at <= now <= end_at:
        return "ongoing"
    return "ended"


@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    fields: dict[str, str]


class ActivityService:
    @staticmethod
    def ensure_indexes():
        Activity.ensure_indexes()
        ActivityVersion.ensure_indexes()
        ActivityRegistration.ensure_indexes()
        try:
            mongo.db["admin_activity_log"].create_index([("created_at", -1)])
        except Exception:
            pass
        try:
            mongo.db["admin_activity_log"].create_index([("activity_id", 1), ("created_at", -1)])
        except Exception:
            pass

    @staticmethod
    def validate_activity(payload: dict, existing: dict | None = None) -> ValidationResult:
        fields: dict[str, str] = {}

        name = str(payload.get("name") or "").strip()
        subtitle = str(payload.get("subtitle") or "").strip()
        start_at = _parse_dt(payload.get("start_at"), "start_at")
        end_at = _parse_dt(payload.get("end_at"), "end_at")
        signup_deadline = _parse_dt(payload.get("signup_deadline"), "signup_deadline")

        capacity = payload.get("capacity")
        try:
            capacity_v = int(capacity) if capacity is not None and capacity != "" else None
        except Exception:
            capacity_v = None
            fields["capacity"] = "Invalid capacity"

        if not name:
            fields["name"] = "Required"
        if existing is None and not subtitle:
            pass

        if start_at is None:
            fields["start_at"] = "Required"
        if end_at is None:
            fields["end_at"] = "Required"

        if isinstance(start_at, datetime) and isinstance(end_at, datetime) and start_at >= end_at:
            fields["end_at"] = "end_at must be after start_at"

        if isinstance(signup_deadline, datetime) and isinstance(start_at, datetime) and signup_deadline > start_at:
            fields["signup_deadline"] = "signup_deadline must be before start_at"

        fee_type = str(payload.get("fee_type") or "free")
        if fee_type not in ["free", "paid"]:
            fields["fee_type"] = "Invalid fee_type"

        ticket_tiers = payload.get("ticket_tiers") or []
        if not isinstance(ticket_tiers, list):
            fields["ticket_tiers"] = "Invalid ticket_tiers"
            ticket_tiers = []

        if fee_type == "paid" and len(ticket_tiers) == 0:
            fields["ticket_tiers"] = "Paid activity requires at least one ticket tier"

        for idx, t in enumerate(ticket_tiers):
            if not isinstance(t, dict):
                fields[f"ticket_tiers[{idx}]"] = "Invalid ticket tier"
                continue
            tname = str(t.get("name") or "").strip()
            if not tname:
                fields[f"ticket_tiers[{idx}].name"] = "Required"
            try:
                price = float(t.get("price") or 0)
                if price < 0:
                    fields[f"ticket_tiers[{idx}].price"] = "price must be >= 0"
            except Exception:
                fields[f"ticket_tiers[{idx}].price"] = "Invalid price"

            try:
                stock = int(t.get("stock") or 0)
                if stock < 0:
                    fields[f"ticket_tiers[{idx}].stock"] = "stock must be >= 0"
            except Exception:
                fields[f"ticket_tiers[{idx}].stock"] = "Invalid stock"

            ebp = t.get("early_bird_price")
            if ebp is not None and ebp != "":
                try:
                    ebpf = float(ebp)
                    if ebpf < 0:
                        fields[f"ticket_tiers[{idx}].early_bird_price"] = "early_bird_price must be >= 0"
                except Exception:
                    fields[f"ticket_tiers[{idx}].early_bird_price"] = "Invalid early_bird_price"
                eb_until = _parse_dt(t.get("early_bird_until"), f"ticket_tiers[{idx}].early_bird_until")
                if eb_until is None:
                    fields[f"ticket_tiers[{idx}].early_bird_until"] = "Required when early_bird_price set"

        if capacity_v is not None and capacity_v <= 0:
            fields["capacity"] = "capacity must be > 0"

        if fee_type == "free" and ticket_tiers:
            pass

        form_fields = payload.get("form_fields") or []
        if not isinstance(form_fields, list):
            fields["form_fields"] = "Invalid form_fields"
            form_fields = []
        for idx, f in enumerate(form_fields):
            if not isinstance(f, dict):
                fields[f"form_fields[{idx}]"] = "Invalid field"
                continue
            label = str(f.get("label") or "").strip()
            ftype = str(f.get("type") or "").strip()
            if not label:
                fields[f"form_fields[{idx}].label"] = "Required"
            if ftype not in ["text", "single", "multi", "file"]:
                fields[f"form_fields[{idx}].type"] = "Invalid type"
            if ftype in ["single", "multi"]:
                opts = f.get("options") or []
                if not isinstance(opts, list) or len([x for x in opts if str(x).strip()]) == 0:
                    fields[f"form_fields[{idx}].options"] = "Options required"

        return ValidationResult(ok=len(fields) == 0, fields=fields)

    @staticmethod
    def admin_list(query: dict):
        page = int(query.get("page") or 1)
        page_size = int(query.get("page_size") or 20)
        qstr = str(query.get("q") or "").strip()
        status = str(query.get("status") or "").strip()
        start = _parse_dt(query.get("start"), "start")
        end = _parse_dt(query.get("end"), "end")

        mongo_q: dict[str, Any] = {}
        if qstr:
            mongo_q["$text"] = {"$search": qstr}
        if status:
            mongo_q["status"] = status
        if start or end:
            rng: dict[str, Any] = {}
            if start:
                rng["$gte"] = start
            if end:
                rng["$lte"] = end
            mongo_q["start_at"] = rng

        sort_by = str(query.get("sort_by") or "created_at")
        sort_dir = int(query.get("sort_dir") or -1)
        if sort_by not in ["created_at", "start_at", "status"]:
            sort_by = "created_at"
        sort = [(sort_by, sort_dir)]

        total = mongo.db[Activity.COL].count_documents(mongo_q)
        cursor = (
            mongo.db[Activity.COL]
            .find(mongo_q)
            .sort(sort)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        rows = list(cursor)
        for r in rows:
            r["time_status"] = _activity_time_status(r)
            r["signup_count"] = ActivityRegistration.count_by_activity(str(r["_id"]))
            r["paid_count"] = ActivityRegistration.count_paid_by_activity(str(r["_id"]))
        return rows, total

    @staticmethod
    def admin_get(activity_id: str):
        a = Activity.get(activity_id)
        if not a:
            raise NotFoundError("Activity not found")
        a["time_status"] = _activity_time_status(a)
        a["signup_count"] = ActivityRegistration.count_by_activity(activity_id)
        a["paid_count"] = ActivityRegistration.count_paid_by_activity(activity_id)
        a["has_paid_orders"] = bool(a["paid_count"])
        return a

    @staticmethod
    def admin_create_draft(actor_admin_id: str):
        doc = {
            "name": "未命名活动",
            "subtitle": "",
            "description": "",
            "cover": "",
            "location": {"address": "", "lat": None, "lng": None},
            "start_at": None,
            "end_at": None,
            "signup_deadline": None,
            "capacity": None,
            "tags": [],
            "fee_type": "free",
            "ticket_tiers": [],
            "form_fields": [],
            "status": Activity.STATUS_DRAFT,
            "publish_at": None,
            "created_by": ObjectId(actor_admin_id),
            "updated_by": ObjectId(actor_admin_id),
        }
        activity_id = Activity.create(doc)
        return activity_id

    @staticmethod
    def _has_paid_orders(activity_id: str) -> bool:
        return ActivityRegistration.count_paid_by_activity(activity_id) > 0

    @staticmethod
    def _restrict_updates_if_paid(activity: dict, updates: dict) -> dict:
        if activity.get("status") != Activity.STATUS_PUBLISHED:
            return updates
        if not ActivityService._has_paid_orders(str(activity["_id"])):
            return updates

        allowed = ["name", "subtitle", "description", "cover", "tags", "location"]
        restricted = {k: v for k, v in updates.items() if k in allowed}
        restricted["restricted_edit"] = True
        return restricted

    @staticmethod
    def _build_ticket_tiers(activity_id: str, payload: dict) -> list[dict]:
        fee_type = str(payload.get("fee_type") or "free")
        tiers = payload.get("ticket_tiers") or []
        if fee_type == "free":
            return []
        paid_by_tier = ActivityRegistration.count_paid_by_tier(activity_id)
        out: list[dict] = []
        for t in tiers:
            if not isinstance(t, dict):
                continue
            tier_id = str(t.get("tier_id") or "") or str(ObjectId())
            sold = int(paid_by_tier.get(tier_id) or 0)
            stock = int(t.get("stock") or 0)
            if stock < sold:
                raise ValidationError("ticket stock cannot be less than sold", data={"fields": {f"ticket_tiers[{tier_id}].stock": "stock < sold"}})
            out.append(
                {
                    "tier_id": tier_id,
                    "name": str(t.get("name") or "").strip(),
                    "price": float(t.get("price") or 0),
                    "stock": stock,
                    "sold": sold,
                    "early_bird_price": float(t.get("early_bird_price") or 0) if (t.get("early_bird_price") not in [None, ""]) else None,
                    "early_bird_until": _parse_dt(t.get("early_bird_until"), "early_bird_until"),
                }
            )
        return out

    @staticmethod
    def admin_update(activity_id: str, actor_admin_id: str, payload: dict, mode: str = "save"):
        activity = Activity.get(activity_id)
        if not activity:
            raise NotFoundError("Activity not found")

        validate = ActivityService.validate_activity(payload, existing=activity)
        if mode != "draft" and not validate.ok:
            raise ValidationError("Validation failed", data={"fields": validate.fields})

        updates: dict[str, Any] = {}
        updates.update(_pick(payload, ["name", "subtitle", "description", "cover", "tags"]))
        updates["location"] = payload.get("location") or activity.get("location") or {"address": "", "lat": None, "lng": None}
        updates["fee_type"] = str(payload.get("fee_type") or activity.get("fee_type") or "free")
        updates["form_fields"] = payload.get("form_fields") or []
        updates["capacity"] = payload.get("capacity")

        updates["start_at"] = _parse_dt(payload.get("start_at"), "start_at")
        updates["end_at"] = _parse_dt(payload.get("end_at"), "end_at")
        updates["signup_deadline"] = _parse_dt(payload.get("signup_deadline"), "signup_deadline")

        updates["ticket_tiers"] = ActivityService._build_ticket_tiers(activity_id, payload)
        updates["updated_by"] = ObjectId(actor_admin_id)

        updates = ActivityService._restrict_updates_if_paid(activity, updates)

        before = deepcopy(activity)
        Activity.update(activity_id, updates)
        after = Activity.get(activity_id)
        if not after:
            raise AppError("Update failed", 500)

        if mode != "draft":
            ActivityService._create_version(activity_id, actor_admin_id, before, after, action="save")
        return after

    @staticmethod
    def _create_version(activity_id: str, actor_admin_id: str, before: dict, after: dict, action: str):
        diff: dict[str, Any] = {}
        keys = set(before.keys()) | set(after.keys())
        ignore = {"updated_at"}
        for k in keys:
            if k in ignore:
                continue
            if before.get(k) != after.get(k):
                diff[k] = {"from": before.get(k), "to": after.get(k)}
        changed = _field_paths(diff)

        version_no = ActivityVersion.next_version_no(activity_id)
        doc = {
            "activity_id": ObjectId(activity_id),
            "version_no": version_no,
            "action": action,
            "actor_admin_id": ObjectId(actor_admin_id),
            "changed_fields": changed,
            "changed_summary": changed[:10],
            "snapshot": after,
            "created_at": _now(),
        }
        ActivityVersion.create(doc)
        return version_no

    @staticmethod
    def admin_versions(activity_id: str):
        activity = Activity.get(activity_id)
        if not activity:
            raise NotFoundError("Activity not found")
        return ActivityVersion.list(activity_id, limit=80)

    @staticmethod
    def admin_publish(activity_id: str, actor_admin_id: str, mode: str, publish_at: str | None):
        activity = Activity.get(activity_id)
        if not activity:
            raise NotFoundError("Activity not found")

        validate = ActivityService.validate_activity({**activity, **{"start_at": activity.get("start_at"), "end_at": activity.get("end_at"), "signup_deadline": activity.get("signup_deadline")}}, existing=activity)
        if not validate.ok:
            raise ValidationError("Validation failed", data={"fields": validate.fields})

        updates: dict[str, Any] = {"updated_by": ObjectId(actor_admin_id)}
        if mode == "now":
            updates["status"] = Activity.STATUS_PUBLISHED
            updates["publish_at"] = _now()
        elif mode == "schedule":
            dt = _parse_dt(publish_at, "publish_at")
            if dt is None:
                raise ValidationError("publish_at required for schedule")
            updates["status"] = Activity.STATUS_SCHEDULED
            updates["publish_at"] = dt
        else:
            raise ValidationError("Invalid publish mode")

        before = deepcopy(activity)
        Activity.update(activity_id, updates)
        after = Activity.get(activity_id)
        ActivityService._create_version(activity_id, actor_admin_id, before, after, action="publish")
        ActivityService._admin_activity_log(actor_admin_id, "publish", activity_id, {"mode": mode})
        return after

    @staticmethod
    def admin_offline(activity_id: str, actor_admin_id: str):
        activity = Activity.get(activity_id)
        if not activity:
            raise NotFoundError("Activity not found")
        before = deepcopy(activity)
        Activity.update(activity_id, {"status": Activity.STATUS_OFFLINE, "updated_by": ObjectId(actor_admin_id)})
        after = Activity.get(activity_id)
        ActivityService._create_version(activity_id, actor_admin_id, before, after, action="offline")
        ActivityService._admin_activity_log(actor_admin_id, "offline", activity_id, {})
        return after

    @staticmethod
    def admin_rollback(activity_id: str, actor_admin_id: str, version_id: str):
        activity = Activity.get(activity_id)
        if not activity:
            raise NotFoundError("Activity not found")
        v = ActivityVersion.get(version_id)
        if not v or str(v.get("activity_id")) != str(ObjectId(activity_id)):
            raise NotFoundError("Version not found")
        snapshot = v.get("snapshot") or {}
        if not isinstance(snapshot, dict):
            raise AppError("Invalid version snapshot", 500)

        validate = ActivityService.validate_activity(snapshot, existing=activity)
        if not validate.ok:
            raise ValidationError("Validation failed", data={"fields": validate.fields})

        before = deepcopy(activity)
        forbidden_keys = {"_id", "created_at", "created_by"}
        updates = {k: deepcopy(snapshot.get(k)) for k in snapshot.keys() if k not in forbidden_keys}
        updates["updated_by"] = ObjectId(actor_admin_id)
        Activity.update(activity_id, updates)
        after = Activity.get(activity_id)
        ActivityService._create_version(activity_id, actor_admin_id, before, after, action="rollback")
        ActivityService._admin_activity_log(actor_admin_id, "rollback", activity_id, {"from_version_id": version_id})
        return after

    @staticmethod
    def _admin_activity_log(actor_admin_id: str, action: str, activity_id: str, data: dict):
        try:
            mongo.db["admin_activity_log"].insert_one(
                {
                    "actor_admin_id": ObjectId(actor_admin_id),
                    "action": action,
                    "activity_id": ObjectId(activity_id),
                    "data": data or {},
                    "created_at": _now(),
                }
            )
        except Exception:
            pass

    @staticmethod
    def public_list(query: dict):
        page = int(query.get("page") or 1)
        page_size = int(query.get("page_size") or 12)
        qstr = str(query.get("q") or "").strip()
        status = str(query.get("status") or "").strip()
        start = _parse_dt(query.get("start"), "start")
        end = _parse_dt(query.get("end"), "end")

        now = _now()
        mongo_q: dict[str, Any] = {
            "$or": [
                {"status": Activity.STATUS_PUBLISHED},
                {"status": Activity.STATUS_SCHEDULED, "publish_at": {"$lte": now}},
            ]
        }
        if qstr:
            mongo_q["$text"] = {"$search": qstr}
        if status in ["not_started", "ongoing", "ended"]:
            if status == "not_started":
                mongo_q["start_at"] = {"$gt": now}
            elif status == "ongoing":
                mongo_q["start_at"] = {"$lte": now}
                mongo_q["end_at"] = {"$gte": now}
            elif status == "ended":
                mongo_q["end_at"] = {"$lt": now}

        if start or end:
            rng: dict[str, Any] = {}
            if start:
                rng["$gte"] = start
            if end:
                rng["$lte"] = end
            mongo_q["start_at"] = {**mongo_q.get("start_at", {}), **rng} if isinstance(mongo_q.get("start_at"), dict) else rng

        sort_by = str(query.get("sort_by") or "start_at")
        sort_dir = int(query.get("sort_dir") or 1)
        if sort_by not in ["created_at", "start_at"]:
            sort_by = "start_at"
        sort = [(sort_by, sort_dir)]

        total = mongo.db[Activity.COL].count_documents(mongo_q)
        cursor = (
            mongo.db[Activity.COL]
            .find(mongo_q, projection={"description": 0, "form_fields": 0})
            .sort(sort)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        rows = list(cursor)
        for r in rows:
            r["time_status"] = _activity_time_status(r)
            r["signup_count"] = ActivityRegistration.count_by_activity(str(r["_id"]))
        return rows, total

    @staticmethod
    def public_detail(activity_id: str):
        a = Activity.get(activity_id)
        if not a:
            raise NotFoundError("Activity not found")
        st = a.get("status")
        if st not in [Activity.STATUS_PUBLISHED, Activity.STATUS_SCHEDULED]:
            raise NotFoundError("Activity not found")
        if st == Activity.STATUS_SCHEDULED:
            publish_at = a.get("publish_at")
            if isinstance(publish_at, datetime) and publish_at > _now():
                raise NotFoundError("Activity not found")
        a["time_status"] = _activity_time_status(a)
        a["signup_count"] = ActivityRegistration.count_by_activity(activity_id)
        return a

    @staticmethod
    def register(activity_id: str, user_id: str, payload: dict):
        a = Activity.get(activity_id)
        if not a:
            raise NotFoundError("Activity not found")
        if a.get("status") != Activity.STATUS_PUBLISHED:
            raise ForbiddenError("Activity not open for registration")

        deadline = a.get("signup_deadline")
        if isinstance(deadline, datetime) and _now() > deadline:
            raise ForbiddenError("Signup closed")

        capacity = a.get("capacity")
        capacity_v = int(capacity) if capacity not in [None, ""] else None
        lock = DistributedLock(redis_client)
        lock_key = f"activity:reg:{activity_id}"
        token = None
        for attempt in range(6):
            token = lock.acquire(lock_key, ttl_ms=5000)
            if token:
                break
            backoff_sleep(attempt)
        try:
            current_cnt = ActivityRegistration.count_by_activity(activity_id)
            if capacity_v is not None and current_cnt >= capacity_v:
                raise ConflictError("No quota left")

            fee_type = str(a.get("fee_type") or "free")
            ticket_tier_id = str(payload.get("ticket_tier_id") or "")
            if fee_type == "paid":
                tiers = a.get("ticket_tiers") or []
                tier = next((x for x in tiers if isinstance(x, dict) and str(x.get("tier_id")) == ticket_tier_id), None)
                if not tier:
                    raise ValidationError("Invalid ticket tier")
                stock = int(tier.get("stock") or 0)
                sold = int(tier.get("sold") or 0)
                if sold >= stock:
                    raise ConflictError("Ticket sold out")

            doc = {
                "activity_id": ObjectId(activity_id),
                "user_id": ObjectId(user_id),
                "ticket_tier_id": ticket_tier_id or None,
                "answers": payload.get("answers") or {},
                "status": ActivityRegistration.STATUS_PENDING if fee_type == "paid" else ActivityRegistration.STATUS_PAID,
                "created_at": _now(),
            }
            try:
                mongo.db[ActivityRegistration.COL].insert_one(doc)
            except DuplicateKeyError:
                raise ConflictError("Already registered")

            if fee_type == "paid" and ticket_tier_id:
                mongo.db[Activity.COL].update_one(
                    {"_id": ObjectId(activity_id), "ticket_tiers.tier_id": ticket_tier_id},
                    {"$inc": {"ticket_tiers.$.sold": 1}},
                )
            return True
        finally:
            if token:
                lock.release(lock_key, token)

