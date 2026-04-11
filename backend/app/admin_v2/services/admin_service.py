from __future__ import annotations

"""
管理端业务服务（Service）。

该层聚合多集合统计查询，并对重计算接口加入缓存，避免频繁聚合导致性能波动。
"""

from ...extensions import mongo
from ...utils.cache import get_json, set_json


class AdminService:
    @staticmethod
    def get_stats(cache_ttl_seconds: int = 10):
        """
        获取后台概览统计，并使用 Redis 缓存短时间结果。

        :param cache_ttl_seconds: 缓存时间（秒），默认 10s
        :return: {"users":..., "products":..., "orders":..., "total_sales":...}
        """
        key = "admin:stats:v1"
        cached = get_json(key)
        if isinstance(cached, dict):
            return cached

        user_count = mongo.db.users.count_documents({})
        product_count = mongo.db.products.count_documents({})
        order_count = mongo.db.orders.count_documents({})

        pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
        total_sales = 0.0
        agg = list(mongo.db.orders.aggregate(pipeline))
        if agg:
            total_sales = float(agg[0].get("total", 0) or 0)

        data = {
            "users": int(user_count),
            "products": int(product_count),
            "orders": int(order_count),
            "total_sales": float(total_sales),
        }
        set_json(key, data, ttl_seconds=cache_ttl_seconds)
        return data
