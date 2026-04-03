from flask import Blueprint, request
from ..models.order_model import Order
from ..models.cart_model import Cart
from ..utils.response import ApiResponse
from ..utils.jwt_util import JwtUtil
from flask_jwt_extended import jwt_required

order_bp = Blueprint('order', __name__)

@order_bp.route('/create', methods=['POST'])
@jwt_required()
def create_order():
    """
    创建订单接口
    POST /api/order/create
    Body: { "items": [...], "total_amount": 100, "shipping_address": "..." }
    """
    user_id = JwtUtil.get_current_user_id()
    data = request.get_json()
    items = data.get('items')
    total_amount = data.get('total_amount')
    shipping_address = data.get('shipping_address')
    
    if not items or not total_amount or not shipping_address:
        return ApiResponse.error("Missing order information")
        
    order_id = Order.create(user_id, items, total_amount, shipping_address)
    
    # 订单创建成功后清空购物车
    Cart.clear_cart(user_id)
    
    return ApiResponse.success({"order_id": str(order_id)}, "Order created successfully", 201)

@order_bp.route('/history', methods=['GET'])
@jwt_required()
def order_history():
    """
    获取历史订单接口
    GET /api/order/history
    """
    user_id = JwtUtil.get_current_user_id()
    orders = Order.find_by_user_id(user_id)
    
    for o in orders:
        o['_id'] = str(o['_id'])
        o['user_id'] = str(o['user_id'])
        for item in o['items']:
            item['product_id'] = str(item['product_id'])
            
    return ApiResponse.success({"orders": orders})

@order_bp.route('/<order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """
    获取订单详情接口
    GET /api/order/<order_id>
    """
    order = Order.find_by_id(order_id)
    if not order:
        return ApiResponse.not_found("Order not found")
        
    order['_id'] = str(order['_id'])
    order['user_id'] = str(order['user_id'])
    return ApiResponse.success(order)
