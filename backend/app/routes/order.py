from flask import Blueprint, request
from ..models.order_model import Order
from ..models.cart_model import Cart
from ..models.product_model import Product
from ..services.payment_service import PaymentService
from ..utils.response import ApiResponse
from ..utils.jwt_util import JwtUtil
from flask_jwt_extended import jwt_required

order_bp = Blueprint('order', __name__)

ALLOWED_ORDER_STATUSES = {
    "pending",
    "paid",
    "shipped",
    "delivered",
    "completed",
    "cancel_requested",
    "cancelled",
    "after_sale_pending",
    "after_sale_approved",
    "after_sale_rejected"
}

@order_bp.route('/create', methods=['POST'])
@jwt_required()
def create_order():
    """
    创建订单接口
    POST /api/order/create
    Body: { "items": [...], "total_amount": 100, "shipping_address": "..." }
    """
    user_id = JwtUtil.get_current_user_id()
    data = request.get_json(silent=True) or {}
    items = data.get('items') or []
    shipping_address = data.get('shipping_address')

    if not items or not isinstance(items, list) or not shipping_address:
        return ApiResponse.error("Missing order information")

    normalized_items = []
    total_amount = 0.0

    for item in items:
        product_id = item.get("product_id")
        quantity = item.get("quantity", 1)
        if not product_id:
            return ApiResponse.error("Missing product_id")
        try:
            quantity = int(quantity)
        except Exception:
            return ApiResponse.error("Invalid quantity")
        if quantity <= 0:
            return ApiResponse.error("Invalid quantity")

        product = Product.find_by_id(product_id)
        if not product:
            return ApiResponse.error("Product not found")
        stock = int(product.get("stock", 0) or 0)
        if stock < quantity:
            return ApiResponse.error("Insufficient stock")

        unit_price = float(product.get("price", 0) or 0)
        total_amount += unit_price * quantity
        normalized_items.append({
            "product_id": product_id,
            "quantity": quantity,
            "unit_price": unit_price,
            "name": product.get("name")
        })

    for item in normalized_items:
        Product.update_stock(item["product_id"], item["quantity"])

    order_id = Order.create(user_id, normalized_items, total_amount, shipping_address)

    for item in normalized_items:
        Cart.remove_item(user_id, item["product_id"])

    return ApiResponse.success({"order_id": str(order_id), "total_amount": total_amount}, "Order created successfully", 201)

@order_bp.route('/history', methods=['GET'])
@jwt_required()
def order_history():
    """
    获取历史订单接口
    GET /api/order/history
    """
    user_id = JwtUtil.get_current_user_id()
    status = request.args.get("status")
    if status and status not in ALLOWED_ORDER_STATUSES:
        return ApiResponse.error("Invalid status")

    orders = Order.find_by_user_id(user_id)
    if status:
        orders = [o for o in orders if o.get("status") == status]
    
    for o in orders:
        o['_id'] = str(o['_id'])
        o['user_id'] = str(o['user_id'])
        for item in o.get('items', []):
            if item.get('product_id') is not None:
                item['product_id'] = str(item['product_id'])
            
    return ApiResponse.success({"orders": orders})

@order_bp.route('/<order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """
    获取订单详情接口
    GET /api/order/<order_id>
    """
    user_id = JwtUtil.get_current_user_id()
    order = Order.find_by_id(order_id)
    if not order:
        return ApiResponse.not_found("Order not found")
    if str(order.get("user_id")) != str(user_id):
        return ApiResponse.error("Permission denied", 403)

    order['_id'] = str(order['_id'])
    order['user_id'] = str(order['user_id'])
    for item in order.get('items', []):
        if item.get('product_id') is not None:
            item['product_id'] = str(item['product_id'])
    return ApiResponse.success(order)

@order_bp.route('/<order_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_order(order_id):
    """
    取消订单接口
    PUT /api/order/<order_id>/cancel
    """
    user_id = JwtUtil.get_current_user_id()
    order = Order.find_by_id(order_id)
    if not order:
        return ApiResponse.not_found("Order not found")
    if str(order.get('user_id')) != str(user_id):
        return ApiResponse.error("Permission denied", 403)

    status = order.get("status")
    if status in ("cancelled", "completed"):
        return ApiResponse.error("Order cannot be cancelled")
    if status == "cancel_requested":
        return ApiResponse.error("Cancel already requested")

    data = request.get_json(silent=True) or {}
    reason = data.get("reason", "")
    updated = Order.request_cancel(order_id, user_id, reason)
    if not updated or updated.matched_count == 0:
        return ApiResponse.error("Failed to submit cancel request")
    return ApiResponse.success({"order_id": order_id}, "Cancel requested successfully")


@order_bp.route('/<order_id>/pay', methods=['POST'])
@jwt_required()
def pay_order(order_id):
    user_id = JwtUtil.get_current_user_id()
    order = Order.find_by_id(order_id)
    if not order:
        return ApiResponse.not_found("Order not found")
    if str(order.get('user_id')) != str(user_id):
        return ApiResponse.error("Permission denied", 403)
    if order.get("status") != "pending":
        return ApiResponse.error("Order is not payable")

    data = request.get_json(silent=True) or {}
    payment_method = data.get("payment_method")
    if not payment_method:
        return ApiResponse.error("Missing payment_method")

    result = PaymentService.process_payment(order_id, payment_method)
    if result.get("status") == "success":
        return ApiResponse.success(message=result.get("message"))
    return ApiResponse.error(result.get("message", "Payment failed"))


@order_bp.route('/<order_id>/review', methods=['POST'])
@jwt_required()
def review_order(order_id):
    user_id = JwtUtil.get_current_user_id()
    order = Order.find_by_id(order_id)
    if not order:
        return ApiResponse.not_found("Order not found")
    if str(order.get('user_id')) != str(user_id):
        return ApiResponse.error("Permission denied", 403)
    if order.get("status") not in ("delivered", "completed"):
        return ApiResponse.error("Order is not reviewable")
    if order.get("review"):
        return ApiResponse.error("Order already reviewed")

    data = request.get_json(silent=True) or {}
    rating = data.get("rating")
    content = data.get("content", "")
    try:
        rating = int(rating)
    except Exception:
        return ApiResponse.error("Invalid rating")
    if rating < 1 or rating > 5:
        return ApiResponse.error("Invalid rating")

    updated = Order.add_review(order_id, user_id, rating, content)
    if not updated or updated.matched_count == 0:
        return ApiResponse.error("Failed to submit review")
    return ApiResponse.success({"order_id": order_id}, "Review submitted")


@order_bp.route('/<order_id>/after_sale', methods=['POST'])
@jwt_required()
def after_sale(order_id):
    user_id = JwtUtil.get_current_user_id()
    order = Order.find_by_id(order_id)
    if not order:
        return ApiResponse.not_found("Order not found")
    if str(order.get('user_id')) != str(user_id):
        return ApiResponse.error("Permission denied", 403)
    if order.get("status") in ("cancelled",):
        return ApiResponse.error("Order is not eligible for after-sale")
    if order.get("after_sale"):
        return ApiResponse.error("After-sale already submitted")

    data = request.get_json(silent=True) or {}
    req_type = data.get("type")
    reason = data.get("reason", "")
    if req_type not in ("refund", "return", "repair"):
        return ApiResponse.error("Invalid type")

    updated = Order.create_after_sale(order_id, user_id, req_type, reason)
    if not updated or updated.matched_count == 0:
        return ApiResponse.error("Failed to submit after-sale")
    return ApiResponse.success({"order_id": order_id}, "After-sale submitted")
