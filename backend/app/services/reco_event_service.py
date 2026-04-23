from datetime import datetime

from bson import ObjectId

from ..extensions import mongo


class RecoEventService:
    @staticmethod
    def log_event(event: dict):
        payload = dict(event or {})
        payload["created_at"] = datetime.now()
        user_id = payload.get("user_id")
        if user_id:
            try:
                payload["user_id"] = ObjectId(str(user_id))
            except Exception:
                payload["user_id"] = str(user_id)
        product_id = payload.get("product_id")
        if product_id:
            try:
                payload["product_id"] = ObjectId(str(product_id))
            except Exception:
                payload["product_id"] = str(product_id)

        mongo.db.reco_events.insert_one(payload)
        return True

