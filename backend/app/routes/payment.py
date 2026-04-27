"""
支付相关 API 路由（/api/payment）。

职责：
- 订单支付发起入口（调用 PaymentService）

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Flask Blueprint
- Flask-JWT-Extended（jwt_required）
- PaymentService
"""

from flask import Blueprint, request, current_app
from ..services.payment_service import PaymentService
from ..models.order_model import Order
from ..utils.response import ApiResponse
from ..utils.jwt_util import JwtUtil
from flask_jwt_extended import jwt_required

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/checkout', methods=['POST'])
@jwt_required()
def checkout():
    """
    结账/支付接口
    POST /api/payment/checkout
    Body: { "order_id": "...", "payment_method": "..." }
    """
    data = request.get_json(silent=True) or {}
    order_id = data.get('order_id')
    payment_method = data.get('payment_method')
    
    if not order_id or not payment_method:
        return ApiResponse.error("Missing order_id or payment_method")
        
    user_id = JwtUtil.get_current_user_id()
    try:
        order = Order.find_by_id(order_id)
    except Exception:
        current_app.logger.exception("Failed to load order in payment checkout")
        return ApiResponse.error("Invalid order_id", 400)

    if not order:
        return ApiResponse.not_found("Order not found")
    if str(order.get("user_id")) != str(user_id):
        return ApiResponse.error("Permission denied", 403)
    if order.get("status") != "pending":
        return ApiResponse.error("Order is not payable")

    result = PaymentService.process_payment(order_id, payment_method)
    
    if result['status'] == "success":
        return ApiResponse.success(message=result['message'])
    else:
        return ApiResponse.error(result['message'])
