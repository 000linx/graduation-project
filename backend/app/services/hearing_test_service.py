from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId

from ..extensions import mongo


class HearingTestService:
    COLLECTION = "hearing_tests"
    STANDARD_FREQS = [250, 500, 1000, 2000, 4000, 8000]

    @staticmethod
    def ensure_indexes():
        try:
            mongo.db[HearingTestService.COLLECTION].create_index([("user_id", 1), ("created_at", -1)])
        except Exception:
            pass

    @staticmethod
    def _degree_from_pta(pta: float) -> dict[str, Any]:
        if pta <= 25:
            label = "正常"
        elif pta <= 40:
            label = "轻度"
        elif pta <= 55:
            label = "中度"
        elif pta <= 70:
            label = "中重度"
        elif pta <= 90:
            label = "重度"
        else:
            label = "极重度"
        return {"pta": float(round(pta, 1)), "degree": label}

    @staticmethod
    def _pta(thresholds: dict[str, Any]) -> float:
        pick = []
        for f in [500, 1000, 2000, 4000]:
            v = thresholds.get(str(f))
            if isinstance(v, (int, float)):
                pick.append(float(v))
        if not pick:
            return 0.0
        return sum(pick) / len(pick)

    @staticmethod
    def build_report(thresholds: dict[str, Any]) -> dict[str, Any]:
        left = thresholds.get("left") if isinstance(thresholds, dict) else None
        right = thresholds.get("right") if isinstance(thresholds, dict) else None
        left = left if isinstance(left, dict) else {}
        right = right if isinstance(right, dict) else {}

        left_pta = HearingTestService._pta(left)
        right_pta = HearingTestService._pta(right)

        return {
            "freqs": list(HearingTestService.STANDARD_FREQS),
            "left": HearingTestService._degree_from_pta(left_pta),
            "right": HearingTestService._degree_from_pta(right_pta),
        }

    @staticmethod
    def create_test(user_id: str, thresholds: dict[str, Any], meta: dict[str, Any] | None = None) -> dict[str, Any]:
        uid = ObjectId(user_id)
        report = HearingTestService.build_report(thresholds)
        now = datetime.now()
        doc = {
            "user_id": uid,
            "created_at": now,
            "thresholds": thresholds,
            "report": report,
            "meta": meta or {},
        }
        res = mongo.db[HearingTestService.COLLECTION].insert_one(doc)
        out = dict(doc)
        out["_id"] = str(res.inserted_id)
        out["user_id"] = str(uid)
        out["created_at"] = now.isoformat()
        return out

    @staticmethod
    def get_latest(user_id: str) -> dict[str, Any] | None:
        uid = ObjectId(user_id)
        doc = mongo.db[HearingTestService.COLLECTION].find_one({"user_id": uid}, sort=[("created_at", -1)])
        if not doc:
            return None
        out = dict(doc)
        out["_id"] = str(out.get("_id"))
        out["user_id"] = str(uid)
        ca = out.get("created_at")
        if isinstance(ca, datetime):
            out["created_at"] = ca.isoformat()
        return out
