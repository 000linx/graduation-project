"""
商品列表流式更新的版本控制服务。

职责：
- 维护一个全局递增版本号（用于 SSE/轮询场景的“数据是否有更新”判断）
- 当商品在后台被创建/更新/删除时递增版本号

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- MongoDB collection: product_stream_meta
"""

from datetime import datetime

from pymongo import ReturnDocument

from ..extensions import mongo


class ProductStreamService:
    """
    商品流版本服务（全局）。

    Notes:
        - 版本号存储在 META_COL 的固定文档 _id=META_ID 中
        - 版本号用于前端判断是否需要刷新商品列表
    """
    META_COL = "product_stream_meta"
    META_ID = "global"

    @staticmethod
    def get_version() -> int:
        """
        获取当前商品流版本号。

        Returns:
            int: 版本号（不存在时为 0）。
        """
        doc = mongo.db[ProductStreamService.META_COL].find_one({"_id": ProductStreamService.META_ID})
        if not doc:
            return 0
        return int(doc.get("version") or 0)

    @staticmethod
    def bump_version() -> int:
        """
        递增商品流版本号（幂等安全的原子更新）。

        Returns:
            int: 更新后的版本号。
        """
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

