from flask import Blueprint, request
from ..services.payment_service import PaymentService
from ..utils.response import ApiResponse
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
    data = request.get_json()
    order_id = data.get('order_id')
    payment_method = data.get('payment_method')
    
    if not order_id or not payment_method:
        return ApiResponse.error("Missing order_id or payment_method")
        
    # 调用支付服务处理支付
    result = PaymentService.process_payment(order_id, payment_method)
    
    if result['status'] == "success":
        return ApiResponse.success(message=result['message'])
    else:
        return ApiResponse.error(result['message'])
