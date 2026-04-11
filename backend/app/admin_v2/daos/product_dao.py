from __future__ import annotations

"""
管理端商品数据访问层（DAO）。

封装 MongoDB 商品表的管理端写操作与索引初始化，避免 Controller 直接操作集合。
"""

from datetime import datetime
from bson import ObjectId

from ...extensions import mongo


class AdminProductDao:
    """
    管理端商品 DAO：索引、创建、更新、删除。
    """

    @staticmethod
    def ensure_indexes():
        """
        创建管理端常用索引（幂等）。

        说明：索引创建失败不应影响应用启动，因此此处捕获异常并跳过。
        """
        try:
            mongo.db.products.create_index("category")
        except Exception:
            pass
        try:
            mongo.db.products.create_index("created_at")
        except Exception:
            pass
        try:
            mongo.db.products.create_index([("name", 1)])
        except Exception:
            pass

    @staticmethod
    def create(doc: dict):
        """
        创建商品文档，并补齐 created_at/updated_at。
        """
        doc = dict(doc)
        now = datetime.now()
        doc.setdefault("created_at", now)
        doc.setdefault("updated_at", now)
        return mongo.db.products.insert_one(doc).inserted_id

    @staticmethod
    def update_by_id(product_id: str, updates: dict):
        """
        根据商品ID更新（部分更新），并更新 updated_at。
        """
        updates = dict(updates)
        updates["updated_at"] = datetime.now()
        return mongo.db.products.update_one({"_id": ObjectId(product_id)}, {"$set": updates})

    @staticmethod
    def delete_by_id(product_id: str):
        """
        根据商品ID删除商品。
        """
        return mongo.db.products.delete_one({"_id": ObjectId(product_id)})
