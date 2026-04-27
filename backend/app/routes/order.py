"""
订单相关 API 路由（/api/order）。

职责：
- 创建订单（含库存校验与支付流程调用）
- 查询订单列表/详情、更新订单状态

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Flask Blueprint
- Flask-JWT-Extended（jwt_required）
- Order/Cart/Product 模型与 PaymentService
"""

from flask import Blueprint, request, current_app
from ..models.order_model import Order
from ..models.cart_model import Cart
from ..models.product_model import Product
from ..services.payment_service import PaymentService
from ..utils.response import ApiResponse
from ..utils.jwt_util import JwtUtil
from ..utils.serialize import to_safe_json
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

    merged = {}
    for item in items:
        product_id = item.get("product_id")
        if not product_id:
            return ApiResponse.error("Missing product_id")
        quantity = item.get("quantity", 1)
        try:
            quantity = int(quantity)
        except Exception:
            return ApiResponse.error("Invalid quantity")
        if quantity <= 0:
            return ApiResponse.error("Invalid quantity")
        merged[str(product_id)] = merged.get(str(product_id), 0) + quantity

    product_ids = list(merged.keys())
    try:
        products = Product.find_by_ids(product_ids)
        by_id = {str(p.get("_id")): p for p in products}
        if len(by_id) != len(product_ids):
            return ApiResponse.error("Product not found")

        normalized_items = []
        total_amount = 0.0
        for pid in product_ids:
            p = by_id[pid]
            qty = merged[pid]
            stock = int(p.get("stock", 0) or 0)
            if stock < qty:
                return ApiResponse.error("Insufficient stock")
            unit_price = float(p.get("price", 0) or 0)
            total_amount += unit_price * qty
            normalized_items.append({"product_id": pid, "quantity": qty, "unit_price": unit_price, "name": p.get("name")})

        reserved = []
        for it in normalized_items:
            res = Product.reserve_stock(it["product_id"], it["quantity"])
            if not res or res.matched_count == 0:
                for r in reserved:
                    Product.release_stock(r["product_id"], r["quantity"])
                return ApiResponse.error("Insufficient stock")
            reserved.append({"product_id": it["product_id"], "quantity": it["quantity"]})

        order_id = None
        try:
            order_id = Order.create(user_id, normalized_items, total_amount, shipping_address)
        except Exception:
            for r in reserved:
                Product.release_stock(r["product_id"], r["quantity"])
            raise

        for it in normalized_items:
            try:
                Cart.remove_item(user_id, it["product_id"])
            except Exception:
                current_app.logger.exception("Failed to remove cart item after order created")

        return ApiResponse.success({"order_id": str(order_id), "total_amount": total_amount}, "Order created successfully", 201)
    except Exception:
        current_app.logger.exception("Failed to create order")
        return ApiResponse.error("Failed to create order", 500)

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
    return ApiResponse.success({"orders": to_safe_json(orders)})

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

    return ApiResponse.success(to_safe_json(order))

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
