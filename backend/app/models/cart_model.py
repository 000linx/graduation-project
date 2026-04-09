from ..extensions import mongo
from bson import ObjectId
from datetime import datetime

class Cart:
    """
    购物车数据模型，负责购物车数据的 CRUD 操作 (单文档内嵌数组结构)
    """
    
    @staticmethod
    def get_cart(user_id):
        """
        获取用户的完整购物车文档
        """
        return mongo.db.cart.find_one({"user_id": ObjectId(user_id)})

    @staticmethod
    def add_item(user_id, product_id, quantity):
        """
        添加商品到购物车（更新数量或追加）
        """
        # 尝试更新已存在商品的数量
        result = mongo.db.cart.update_one(
            {"user_id": ObjectId(user_id), "items.product_id": ObjectId(product_id)},
            {"$inc": {"items.$.quantity": quantity}, "$set": {"updated_at": datetime.now()}}
        )
        
        # 如果商品不存在于数组中，则追加新商品项 (同时 upsert 文档本身)
        if result.matched_count == 0:
            item = {
                "product_id": ObjectId(product_id),
                "quantity": quantity,
                "added_at": datetime.now()
            }
            mongo.db.cart.update_one(
                {"user_id": ObjectId(user_id)},
                {"$push": {"items": item}, "$set": {"updated_at": datetime.now()}, "$setOnInsert": {"created_at": datetime.now()}},
                upsert=True
            )
        return True

    @staticmethod
    def remove_item(user_id, product_id):
        """
        从购物车移除商品
        """
        return mongo.db.cart.update_one(
            {"user_id": ObjectId(user_id)},
            {"$pull": {"items": {"product_id": ObjectId(product_id)}}, "$set": {"updated_at": datetime.now()}}
        )

    @staticmethod
    def find_by_user_id(user_id):
        """
        查找用户的购物车内容，返回兼容旧版的列表格式
        """
        cart = mongo.db.cart.find_one({"user_id": ObjectId(user_id)})
        if not cart:
            return []
        
        formatted_items = []
        for item in cart.get("items", []):
            formatted_items.append({
                "_id": cart["_id"],  # 兼容旧版的 _id
                "user_id": cart["user_id"],
                "product_id": item["product_id"],
                "quantity": item["quantity"]
            })
        return formatted_items

    @staticmethod
    def clear_cart(user_id):
        """
        清空用户的购物车
        """
        return mongo.db.cart.update_one(
            {"user_id": ObjectId(user_id)},
            {"$set": {"items": [], "updated_at": datetime.now()}}
        )
    
    @staticmethod
    def update_item(user_id, product_id, quantity):
        """
        更新购物车中的商品数量
        """
        if quantity <= 0:
            return Cart.remove_item(user_id, product_id)
            
        result = mongo.db.cart.update_one(
            {"user_id": ObjectId(user_id), "items.product_id": ObjectId(product_id)},
            {"$set": {"items.$.quantity": quantity, "updated_at": datetime.now()}}
        )
        return result.matched_count > 0