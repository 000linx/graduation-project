"""
支付服务（模拟实现）。

职责：
- 提供订单支付处理入口
- 根据支付结果更新订单支付信息与状态

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Order 模型（更新订单状态与支付信息）
- time.sleep（模拟外部支付网关延迟）
"""

import os
from datetime import datetime

from ..models.order_model import Order

class PaymentService:
    """
    支付服务，处理支付相关逻辑
    """
    @staticmethod
    def process_payment(order_id, payment_method):
        """
        处理订单支付（当前为模拟逻辑）。

        Args:
            order_id: 订单 ID（字符串或 ObjectId 字符串）。
            payment_method: 支付方式标识（例如：alipay/wechat/card）。

        Returns:
            dict: {"status": "success"|"failed", "message": str}

        Raises:
            Exception: 当订单更新失败或 order_id 不合法时可能抛出。
        """
        simulate_delay_ms = int(os.getenv("PAYMENT_SIMULATE_DELAY_MS", "0") or 0)
        if simulate_delay_ms > 0:
            import time
            time.sleep(min(simulate_delay_ms, 3000) / 1000.0)

        updated = Order.mark_paid(order_id, payment_method, paid_at=datetime.now())
        if updated and updated.matched_count > 0:
            return {"status": "success", "message": "Payment processed successfully"}
        return {"status": "failed", "message": "Order is not payable"}
