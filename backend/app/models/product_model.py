from ..extensions import mongo
from bson import ObjectId
from datetime import datetime
import re

class Product:
    """
    产品数据模型，负责产品数据的 CRUD 操作
    """
    @staticmethod
    def create(name, description, price, stock, category, image_url=None):
        """
        创建新产品
        :param name: 产品名称
        :param description: 产品描述
        :param price: 价格
        :param stock: 库存数量
        :param category: 分类
        :param image_url: 图片 URL
        :return: 新产品的 ObjectId
        """
        product_data = {
            "name": name,
            "description": description,
            "price": float(price),
            "stock": int(stock),
            "category": category,
            "image_url": image_url,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = mongo.db.products.insert_one(product_data)
        return result.inserted_id

    @staticmethod
    def find_all():
        """
        查找所有产品
        :return: 产品文档列表
        """
        return list(mongo.db.products.find())

    @staticmethod
    def find_by_id(product_id):
        """
        根据 ID 查找产品
        :param product_id: 产品 ID
        :return: 产品文档或 None
        """
        return mongo.db.products.find_one({"_id": ObjectId(product_id)})

    @staticmethod
    def find_by_category(category):
        """
        根据分类查找产品
        :param category: 分类名称
        :return: 产品文档列表
        """
        return list(mongo.db.products.find({"category": category}))

    @staticmethod
    def query(category=None, q=None, min_price=None, max_price=None, sort="newest", page=1, page_size=20):
        query = {}

        if category:
            query["category"] = category

        if q:
            keyword = re.escape(str(q).strip())
            if keyword:
                query["$or"] = [
                    {"name": {"$regex": keyword, "$options": "i"}},
                    {"description": {"$regex": keyword, "$options": "i"}}
                ]

        price_filter = {}
        if min_price is not None:
            price_filter["$gte"] = float(min_price)
        if max_price is not None:
            price_filter["$lte"] = float(max_price)
        if price_filter:
            query["price"] = price_filter

        page = max(int(page), 1)
        page_size = max(min(int(page_size), 100), 1)
        skip = (page - 1) * page_size

        sort_spec = [("created_at", -1)]
        if sort == "price_asc":
            sort_spec = [("price", 1), ("created_at", -1)]
        elif sort == "price_desc":
            sort_spec = [("price", -1), ("created_at", -1)]

        total = mongo.db.products.count_documents(query)
        items = list(mongo.db.products.find(query).sort(sort_spec).skip(skip).limit(page_size))
        return items, total, page, page_size

    @staticmethod
    def update_stock(product_id, quantity):
        """
        更新产品库存（减少库存）
        :param product_id: 产品 ID
        :param quantity: 减少的数量
        :return: 更新结果
        """
        return mongo.db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$inc": {"stock": -quantity}, "$set": {"updated_at": datetime.now()}}
        )

    @staticmethod
    def update_by_id(product_id, updates: dict):
        if not updates:
            return None
        updates = {k: v for k, v in updates.items() if v is not None}
        if "price" in updates:
            updates["price"] = float(updates["price"])
        if "stock" in updates:
            updates["stock"] = int(updates["stock"])
        updates["updated_at"] = datetime.now()
        return mongo.db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": updates}
        )

    @staticmethod
    def delete_by_id(product_id):
        return mongo.db.products.delete_one({"_id": ObjectId(product_id)})
