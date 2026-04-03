from ..extensions import mongo
from bson import ObjectId
from datetime import datetime

class Order:
    """
    订单数据模型，负责订单数据的 CRUD 操作
    """
    @staticmethod
    def create(user_id, items, total_amount, shipping_address):
        """
        创建新订单
        :param user_id: 用户 ID
        :param items: 订单项列表
        :param total_amount: 总金额
        :param shipping_address: 收货地址
        :return: 新订单的 ObjectId
        """
        order_data = {
            "user_id": ObjectId(user_id),
            "items": items, # list of {product_id, quantity, price}
            "total_amount": float(total_amount),
            "shipping_address": shipping_address,
            "status": "pending", # pending, paid, shipped, delivered, cancelled
            "created_at": datetime.utcnow()
        }
        
        result = mongo.db.orders.insert_one(order_data)
        return result.inserted_id

    @staticmethod
    def find_by_user_id(user_id):
        """
        查找用户的所有订单
        :param user_id: 用户 ID
        :return: 订单文档列表
        """
        return list(mongo.db.orders.find({"user_id": ObjectId(user_id)}))

    @staticmethod
    def find_by_id(order_id):
        """
        根据 ID 查找订单
        :param order_id: 订单 ID
        :return: 订单文档或 None
        """
        return mongo.db.orders.find_one({"_id": ObjectId(order_id)})

    @staticmethod
    def update_status(order_id, status):
        """
        更新订单状态
        :param order_id: 订单 ID
        :param status: 新状态
        :return: 更新结果
        """
        return mongo.db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": status}}
        )
