from flask import Blueprint, request
from ..models.cart_model import Cart
from ..utils.response import ApiResponse
from ..utils.jwt_util import JwtUtil
from flask_jwt_extended import jwt_required

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/add', methods=['POST'])
@jwt_required()
def add_to_cart():
    """
    添加商品到购物车接口
    POST /api/cart/add
    Body: { "product_id": "...", "quantity": 1 }
    """
    user_id = JwtUtil.get_current_user_id()
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id:
        return ApiResponse.error("Missing product_id")
        
    Cart.add_item(user_id, product_id, quantity)
    return ApiResponse.success(message="Item added to cart")

@cart_bp.route('/items', methods=['GET'])
@jwt_required()
def get_cart():
    """
    获取购物车内容接口
    GET /api/cart/items
    """
    user_id = JwtUtil.get_current_user_id()
    items = Cart.find_by_user_id(user_id)
    
    for item in items:
        item['_id'] = str(item['_id'])
        item['user_id'] = str(item['user_id'])
        item['product_id'] = str(item['product_id'])
        
    return ApiResponse.success({"items": items})

@cart_bp.route('/remove/<product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(product_id):
    """
    从购物车移除商品接口
    DELETE /api/cart/remove/<product_id>
    """
    user_id = JwtUtil.get_current_user_id()
    Cart.remove_item(user_id, product_id)
    return ApiResponse.success(message="Item removed from cart")
