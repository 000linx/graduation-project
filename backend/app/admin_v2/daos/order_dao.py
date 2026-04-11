from __future__ import annotations

"""
管理端订单数据访问层（DAO）。

封装 MongoDB 的管理端订单查询逻辑，避免 Controller 直接拼装查询与分页细节。
"""

from bson import ObjectId

from ...extensions import mongo


class AdminOrderDao:
    """
    管理端订单 DAO：索引初始化与订单列表查询。
    """

    @staticmethod
    def ensure_indexes():
        """
        创建管理端常用查询索引（幂等）。

        说明：索引创建失败不应影响应用启动，因此此处捕获异常并跳过。
        """
        try:
            mongo.db.orders.create_index("status")
        except Exception:
            pass
        try:
            mongo.db.orders.create_index("created_at")
        except Exception:
            pass
        try:
            mongo.db.orders.create_index("user_id")
        except Exception:
            pass

    @staticmethod
    def list_orders(
        status: str | None,
        user_id: str | None,
        page: int,
        page_size: int,
        sort: str,
    ):
        """
        订单列表查询（支持按状态/用户过滤，支持分页与创建时间排序）。

        :param status: 订单状态（可选）
        :param user_id: 用户ID（可选）
        :param page: 页码（从 1 开始）
        :param page_size: 每页数量
        :param sort: created_at_asc | created_at_desc
        :return: (orders, total)
        """
        q = {}
        if status:
            q["status"] = status
        if user_id:
            q["user_id"] = ObjectId(user_id)

        sort_field = "created_at"
        sort_dir = -1
        if sort in ("created_at_asc", "created_at_desc"):
            sort_dir = 1 if sort.endswith("_asc") else -1

        total = mongo.db.orders.count_documents(q)
        cursor = (
            mongo.db.orders.find(q)
            .sort(sort_field, sort_dir)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        return list(cursor), total
