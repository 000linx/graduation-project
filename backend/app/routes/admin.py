"""
管理员模块（/api/admin）

职责：
- 管理员鉴权与权限校验（JWT + role=admin）
- 用户管理（列表/角色变更）
- 商品管理（新增/编辑/删除）
- 订单管理（列表/状态变更）
- 管理员初始化（bootstrap）与登出（Token 拉黑）
"""

from functools import wraps

from flask import Blueprint, current_app, request
from flask_jwt_extended import jwt_required, get_jwt, decode_token
from bson import ObjectId
import time

from ..extensions import mongo
from .. import extensions
from ..models.order_model import Order
from ..models.product_model import Product
from ..models.user_model import User
from ..utils.jwt_util import JwtUtil
from ..utils.response import ApiResponse


admin_bp = Blueprint('admin', __name__)


def admin_required(fn):
    """
    管理员权限装饰器：
    - 要求请求携带有效 JWT
    - 要求当前用户 role=admin
    """
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = JwtUtil.get_current_user_id()
        user = User.find_by_id(user_id)
        if not user or user.get("role") != "admin":
            return ApiResponse.forbidden("Admin only")
        return fn(*args, **kwargs)
    return wrapper


@admin_bp.route('/bootstrap', methods=['POST'])
def bootstrap_admin():
    """
    初始化首个管理员（仅允许执行一次）。

    安全约束：
    - 必须设置环境变量 ADMIN_BOOTSTRAP_SECRET 才启用
    - 请求头需携带 X-Admin-Bootstrap-Secret 与配置一致

    Body: { "username": "...", "phone": "...", "password": "..." }
    """
    secret = current_app.config.get("ADMIN_BOOTSTRAP_SECRET")
    if not secret:
        return ApiResponse.error("Bootstrap disabled", 403)

    provided = request.headers.get("X-Admin-Bootstrap-Secret")
    if provided != secret:
        return ApiResponse.forbidden("Invalid bootstrap secret")

    existing_admin = mongo.db.users.count_documents({"role": "admin"}) > 0
    if existing_admin:
        return ApiResponse.error("Admin already exists", 409)

    data = request.get_json(silent=True) or {}
    username = data.get("username")
    phone = data.get("phone")
    password = data.get("password")
    if not username or not phone or not password:
        return ApiResponse.error("Missing fields")

    if User.find_by_phone(phone):
        return ApiResponse.error("Phone already exists")

    user_id = User.create(username, phone, password, role="admin")
    return ApiResponse.success({"user_id": str(user_id)}, "Admin created", 201)


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def stats():
    """
    后台概览统计：用户数/商品数/订单数/累计销售额
    GET /api/admin/stats
    """
    user_count = mongo.db.users.count_documents({})
    product_count = mongo.db.products.count_documents({})
    order_count = mongo.db.orders.count_documents({})

    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
    total_sales = 0
    try:
        agg = list(mongo.db.orders.aggregate(pipeline))
        if agg:
            total_sales = agg[0].get("total", 0) or 0
    except Exception:
        total_sales = 0

    return ApiResponse.success({
        "users": user_count,
        "products": product_count,
        "orders": order_count,
        "total_sales": float(total_sales)
    })


@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """
    用户列表（管理员可见）
    GET /api/admin/users
    """
    users = User.find_all()
    result = []
    for u in users:
        result.append({
            "_id": str(u["_id"]),
            "username": u.get("username"),
            "phone": u.get("phone"),
            "role": u.get("role", "user"),
            "created_at": u.get("created_at")
        })
    return ApiResponse.success({"users": result})


@admin_bp.route('/users/<user_id>/role', methods=['PUT'])
@admin_required
def set_user_role(user_id):
    """
    修改用户角色
    PUT /api/admin/users/<user_id>/role
    Body: { "role": "user" | "admin" }
    """
    data = request.get_json(silent=True) or {}
    role = data.get("role")
    if role not in ("user", "admin"):
        return ApiResponse.error("Invalid role")

    updated = User.set_role(user_id, role)
    if not updated or updated.matched_count == 0:
        return ApiResponse.not_found("User not found")
    return ApiResponse.success({"user_id": user_id, "role": role}, "Role updated")


@admin_bp.route('/products', methods=['POST'])
@admin_required
def create_product():
    """
    新增商品
    POST /api/admin/products
    Body: { name*, category*, price*, stock*, description?, image_url? }
    """
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    description = data.get("description", "")
    price = data.get("price")
    stock = data.get("stock")
    category = data.get("category")
    image_url = data.get("image_url")

    if not name or price is None or stock is None or not category:
        return ApiResponse.error("Missing fields")

    product_id = Product.create(name, description, price, stock, category, image_url=image_url)
    return ApiResponse.success({"product_id": str(product_id)}, "Product created", 201)


@admin_bp.route('/products/<product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    """
    编辑商品（部分字段更新）
    PUT /api/admin/products/<product_id>
    Body: { name?, category?, price?, stock?, description?, image_url? }
    """
    data = request.get_json(silent=True) or {}
    allowed = {"name", "description", "price", "stock", "category", "image_url"}
    updates = {k: v for k, v in data.items() if k in allowed}

    updated = Product.update_by_id(product_id, updates)
    if not updated or updated.matched_count == 0:
        return ApiResponse.not_found("Product not found")
    return ApiResponse.success({"product_id": product_id}, "Product updated")


@admin_bp.route('/products/<product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    """
    删除商品
    DELETE /api/admin/products/<product_id>
    """
    deleted = Product.delete_by_id(product_id)
    if not deleted or deleted.deleted_count == 0:
        return ApiResponse.not_found("Product not found")
    return ApiResponse.success({"product_id": product_id}, "Product deleted")


@admin_bp.route('/orders', methods=['GET'])
@admin_required
def list_orders():
    """
    订单列表（管理员可见）
    GET /api/admin/orders
    """
    orders = Order.find_all()
    result = []
    for o in orders:
        items = []
        for item in o.get("items", []):
            items.append({
                **item,
                "product_id": str(item.get("product_id")) if item.get("product_id") is not None else None
            })
        result.append({
            **o,
            "_id": str(o["_id"]),
            "user_id": str(o.get("user_id")) if o.get("user_id") is not None else None,
            "items": items
        })
    return ApiResponse.success({"orders": result})


@admin_bp.route('/orders/<order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id):
    """
    修改订单状态
    PUT /api/admin/orders/<order_id>/status
    Body: { "status": "pending"|"paid"|"shipped"|"delivered"|"cancelled"|"completed" }
    """
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    allowed = {
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
    if status not in allowed:
        return ApiResponse.error("Invalid status")

    updated = Order.update_status(order_id, status)
    if not updated or updated.matched_count == 0:
        return ApiResponse.not_found("Order not found")
    return ApiResponse.success({"order_id": order_id, "status": status}, "Status updated")


@admin_bp.route('/orders/<order_id>/after_sale', methods=['PUT'])
@admin_required
def process_after_sale(order_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    remark = data.get("remark")
    if status not in ("approved", "rejected"):
        return ApiResponse.error("Invalid status")

    updated = Order.process_after_sale(order_id, status, remark=remark)
    if not updated or updated.matched_count == 0:
        return ApiResponse.not_found("Order not found")
    return ApiResponse.success({"order_id": order_id, "status": status}, "After-sale processed")


@admin_bp.route('/logout', methods=['POST'])
@admin_required
def admin_logout():
    """
    管理员登出：将当前 access_token（以及可选 refresh_token）加入黑名单，使其立即失效。
    POST /api/admin/logout
    Body: { "refresh_token"?: "..." }
    """
    payload = get_jwt()
    jti = payload.get("jti")
    exp = payload.get("exp")
    try:
        if extensions.redis_client is not None and jti and exp:
            ttl = max(int(exp - time.time()), 1)
            extensions.redis_client.setex(f"bl:{jti}", ttl, "1")
    except Exception:
        pass

    data = request.get_json(silent=True) or {}
    refresh_token = data.get("refresh_token")
    if refresh_token:
        try:
            decoded = decode_token(refresh_token)
            rjti = decoded.get("jti")
            rexp = decoded.get("exp")
            if extensions.redis_client is not None and rjti and rexp:
                ttl = max(int(rexp - time.time()), 1)
                extensions.redis_client.setex(f"bl:{rjti}", ttl, "1")
        except Exception:
            pass

    return ApiResponse.success(message="Logged out")
