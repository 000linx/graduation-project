from ..extensions import mongo
from bson import ObjectId
from datetime import datetime

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
