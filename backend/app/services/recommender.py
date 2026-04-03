from ..models.product_model import Product

class RecommenderService:
    """
    推荐服务，负责商品推荐逻辑
    """
    @staticmethod
    def get_recommendations(user_id=None):
        """
        获取通用推荐列表
        :param user_id: 用户 ID (可选，用于个性化推荐)
        :return: 推荐产品列表
        """
        # 复杂推荐逻辑占位符 (例如：协同过滤，基于历史记录)
        # 目前简单返回库存最多或最新的产品
        all_products = Product.find_all()
        # 返回前 5 个产品
        return all_products[:5]

    @staticmethod
    def recommend_by_hearing_loss(loss_degree):
        """
        根据听力损失程度推荐助听器
        :param loss_degree: 听力损失程度 (mild, moderate, severe, profound)
        :return: 匹配的产品列表
        """
        # 基于听力损失程度的简单映射逻辑
        category_map = {
            "mild": "CIC", # 轻度 -> 深耳道式 (Completely in Canal)
            "moderate": "ITC", # 中度 -> 耳道式 (In The Canal)
            "severe": "BTE", # 重度 -> 耳背式 (Behind The Ear)
            "profound": "Power BTE" # 极重度 -> 大功率耳背式
        }
        category = category_map.get(loss_degree, "BTE")
        return Product.find_by_category(category)
