from ..models.order_model import Order
import time
from datetime import datetime

class PaymentService:
    """
    支付服务，处理支付相关逻辑
    """
    @staticmethod
    def process_payment(order_id, payment_method):
        """
        处理订单支付
        :param order_id: 订单 ID
        :param payment_method: 支付方式
        :return: 支付结果字典
        """
        # 外部支付网关集成占位符 (例如：支付宝, 微信支付, Stripe 等)
        # 模拟支付处理延迟
        time.sleep(1)
        
        # 在实际应用中，这里会通过回调或 API 调用验证支付状态
        # 模拟支付成功
        payment_status = "success"
        
        if payment_status == "success":
            Order.set_payment(order_id, payment_method, "paid", paid_at=datetime.now())
            Order.update_status(order_id, "paid")
            return {"status": "success", "message": "Payment processed successfully"}
        else:
            Order.set_payment(order_id, payment_method, "failed")
            return {"status": "failed", "message": "Payment failed"}
