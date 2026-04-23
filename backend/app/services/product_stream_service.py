from datetime import datetime

from pymongo import ReturnDocument

from ..extensions import mongo


class ProductStreamService:
    META_COL = "product_stream_meta"
    META_ID = "global"

    @staticmethod
    def get_version() -> int:
        doc = mongo.db[ProductStreamService.META_COL].find_one({"_id": ProductStreamService.META_ID})
        if not doc:
            return 0
        return int(doc.get("version") or 0)

    @staticmethod
    def bump_version() -> int:
        now = datetime.now()
        res = mongo.db[ProductStreamService.META_COL].find_one_and_update(
            {"_id": ProductStreamService.META_ID},
            {"$inc": {"version": 1}, "$set": {"updated_at": now}, "$setOnInsert": {"created_at": now}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        if not res:
            return 0
        return int(res.get("version") or 0)

