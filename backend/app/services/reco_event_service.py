"""
推荐系统事件记录服务。

职责：
- 将用户行为事件（浏览/点击/加购等）写入 reco_events 集合
- 尽可能将 user_id/product_id 规范化为 ObjectId 以便查询与聚合

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- MongoDB collection: reco_events
- bson.ObjectId
"""

from datetime import datetime

from bson import ObjectId

from ..extensions import mongo


class RecoEventService:
    @staticmethod
    def log_event(event: dict):
        """
        记录一条推荐相关事件。

        Args:
            event: 事件字典。建议包含 user_id/product_id/action 等字段。

        Returns:
            bool: 写入成功返回 True。

        Raises:
            Exception: MongoDB 写入失败时可能抛出。
        """
        payload = dict(event or {})
        payload["created_at"] = datetime.now()
        user_id = payload.get("user_id")
        if user_id:
            try:
                # 允许传入 str/ObjectId；尽量规范化为 ObjectId 便于索引命中
                payload["user_id"] = ObjectId(str(user_id))
            except Exception:
                payload["user_id"] = str(user_id)
        product_id = payload.get("product_id")
        if product_id:
            try:
                # 同上：尽量转换为 ObjectId，失败则保留字符串
                payload["product_id"] = ObjectId(str(product_id))
            except Exception:
                payload["product_id"] = str(product_id)

        mongo.db.reco_events.insert_one(payload)
        return True

