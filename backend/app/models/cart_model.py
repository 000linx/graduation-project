from ..extensions import mongo
from bson import ObjectId
from datetime import datetime

class Cart:
    """
    购物车数据模型，负责购物车数据的 CRUD 操作
    """
    @staticmethod
    def add_item(user_id, product_id, quantity):
        """
        添加商品到购物车
        :param user_id: 用户 ID
        :param product_id: 产品 ID
        :param quantity: 数量
        :return: 更新结果或插入结果
        """
        # 检查购物车中是否已存在该商品
        existing_item = mongo.db.cart.find_one({
            "user_id": ObjectId(user_id),
            "product_id": ObjectId(product_id)
        })
        
        if existing_item:
            # 如果存在，增加数量
            return mongo.db.cart.update_one(
                {"_id": existing_item["_id"]},
                {"$inc": {"quantity": quantity}, "$set": {"updated_at": datetime.utcnow()}}
            )
        else:
            # 如果不存在，创建新条目
            cart_data = {
                "user_id": ObjectId(user_id),
                "product_id": ObjectId(product_id),
                "quantity": quantity,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = mongo.db.cart.insert_one(cart_data)
            return result.inserted_id

    @staticmethod
    def remove_item(user_id, product_id):
        """
        从购物车移除商品
        :param user_id: 用户 ID
        :param product_id: 产品 ID
        :return: 删除结果
        """
        return mongo.db.cart.delete_one({
            "user_id": ObjectId(user_id),
            "product_id": ObjectId(product_id)
        })

    @staticmethod
    def find_by_user_id(user_id):
        """
        查找用户的购物车内容
        :param user_id: 用户 ID
        :return: 购物车项列表
        """
        return list(mongo.db.cart.find({"user_id": ObjectId(user_id)}))

    @staticmethod
    def clear_cart(user_id):
        """
        清空用户的购物车
        :param user_id: 用户 ID
        :return: 删除结果
        """
        return mongo.db.cart.delete_many({"user_id": ObjectId(user_id)})
