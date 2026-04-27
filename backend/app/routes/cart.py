"""
购物车相关 API 路由（/api/cart）。

职责：
- 购物车增删改查
- 下单前库存校验（以商品库存为准）

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Flask Blueprint
- Flask-JWT-Extended（jwt_required）
- Cart/Product 模型与 JwtUtil
"""

from flask import Blueprint, request
from ..models.cart_model import Cart
from ..utils.response import ApiResponse
from ..utils.jwt_util import JwtUtil
from ..utils.serialize import to_safe_json
from flask_jwt_extended import jwt_required
from ..models.product_model import Product

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
    data = request.get_json(silent=True) or {}
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id:
        return ApiResponse.error("Missing product_id")
        
    # 检查库存是否足够
    product = Product.find_by_id(product_id)
    if not product:
        return ApiResponse.error("Product not found")
        
    # 获取购物车当前已有数量
    current_cart = Cart.get_cart(user_id)
    current_qty = 0
    if current_cart and "items" in current_cart:
        for item in current_cart["items"]:
            if str(item["product_id"]) == str(product_id):
                current_qty = item.get("quantity", 0)
                break
                
    if product.get('stock', 0) < current_qty + quantity:
        return ApiResponse.error("Insufficient stock")
        
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
    return ApiResponse.success({"items": to_safe_json(items)})

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

@cart_bp.route('/update', methods=['PUT'])
@jwt_required()
def update_cart():
    """
    更改购物车内容接口
    PUT /api/cart/update
    Body: { "product_id": "...", "quantity": 2 }
    """
    user_id = JwtUtil.get_current_user_id()
    data = request.get_json(silent=True) or {}
    product_id = data.get('product_id')
    quantity = data.get('quantity')

    if not product_id:
        return ApiResponse.error("Missing product_id")
    try:
        quantity = int(quantity)
    except Exception:
        return ApiResponse.error("Invalid quantity")
    if quantity < 0:
        return ApiResponse.error("Invalid quantity")

    # 检查商品是否存在
    product = Product.find_by_id(product_id)
    if not product:
        return ApiResponse.error("Product not found")
    # 检查库存
    if product.get('stock', 0) < quantity:
        return ApiResponse.error("Insufficient stock")

    updated = Cart.update_item(user_id, product_id, quantity)
    if not updated:
        return ApiResponse.error("Item not found in cart")

    return ApiResponse.success(message="Cart updated")
