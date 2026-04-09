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
        normalized_items = []
        for item in items or []:
            pid = item.get("product_id")
            qty = item.get("quantity")
            unit_price = item.get("unit_price", item.get("price"))
            name = item.get("name")
            normalized_items.append({
                "product_id": ObjectId(pid) if pid is not None else None,
                "quantity": int(qty),
                "unit_price": float(unit_price) if unit_price is not None else None,
                "name": name
            })

        order_data = {
            "user_id": ObjectId(user_id),
            "items": normalized_items,
            "total_amount": float(total_amount),
            "shipping_address": shipping_address,
            "status": "pending",
            "payment": {
                "status": "unpaid",
                "method": None,
                "paid_at": None
            },
            "cancel_request": None,
            "review": None,
            "after_sale": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
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
    def find_all():
        return list(mongo.db.orders.find())

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
            {"$set": {"status": status, "updated_at": datetime.now()}}
        )

    @staticmethod
    def set_payment(order_id, method, status, paid_at=None):
        update = {
            "payment.status": status,
            "payment.method": method,
            "updated_at": datetime.now()
        }
        if paid_at is not None:
            update["payment.paid_at"] = paid_at
        return mongo.db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update}
        )

    @staticmethod
    def request_cancel(order_id, user_id, reason):
        return mongo.db.orders.update_one(
            {"_id": ObjectId(order_id), "user_id": ObjectId(user_id)},
            {"$set": {
                "status": "cancel_requested",
                "cancel_request": {"reason": reason, "created_at": datetime.now()},
                "updated_at": datetime.now()
            }}
        )

    @staticmethod
    def add_review(order_id, user_id, rating, content):
        return mongo.db.orders.update_one(
            {"_id": ObjectId(order_id), "user_id": ObjectId(user_id)},
            {"$set": {
                "review": {"rating": int(rating), "content": content, "created_at": datetime.now()},
                "status": "completed",
                "updated_at": datetime.now()
            }}
        )

    @staticmethod
    def create_after_sale(order_id, user_id, req_type, reason):
        return mongo.db.orders.update_one(
            {"_id": ObjectId(order_id), "user_id": ObjectId(user_id)},
            {"$set": {
                "after_sale": {
                    "type": req_type,
                    "reason": reason,
                    "status": "pending",
                    "created_at": datetime.now(),
                    "processed_at": None,
                    "remark": None
                },
                "status": "after_sale_pending",
                "updated_at": datetime.now()
            }}
        )

    @staticmethod
    def process_after_sale(order_id, status, remark=None):
        return mongo.db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {
                "after_sale.status": status,
                "after_sale.processed_at": datetime.now(),
                "after_sale.remark": remark,
                "status": f"after_sale_{status}",
                "updated_at": datetime.now()
            }}
        )
