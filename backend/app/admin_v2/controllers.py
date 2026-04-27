"""
管理员模块 Controller 层（路由注册与请求处理）。

特点：
- 保持 /api/admin 路径前缀兼容
- Controller 负责：参数解析/校验、权限装饰器、调用 Service/DAO、统一返回 ApiResponse
- Service/DAO 负责：业务与数据访问细节
"""

from __future__ import annotations

import time
from functools import wraps

from flask import current_app, g, request
from flask_jwt_extended import jwt_required, get_jwt, decode_token
from marshmallow import ValidationError as MarshmallowValidationError
from werkzeug.security import generate_password_hash

from .. import extensions
from ..extensions import mongo
from ..models.order_model import Order
from ..models.user_model import User
from ..services.product_stream_service import ProductStreamService
from ..utils.errors import ConflictError, ValidationError
from ..utils.jwt_util import JwtUtil
from ..utils.response import ApiResponse
from ..utils.serialize import to_safe_json
from .daos.audit_dao import AuditDao
from .daos.order_dao import AdminOrderDao
from .daos.product_dao import AdminProductDao
from .daos.rbac_dao import RbacDao
from .daos.user_dao import AdminUserDao
from .schemas import (
    AdminLoginSchema,
    BootstrapAdminSchema,
    CreateProductBatchSchema,
    CreateProductSchema,
    CreateRoleSchema,
    ListAuditLogsQuerySchema,
    ListOrdersQuerySchema,
    SalesDetailQuerySchema,
    SalesSeriesQuerySchema,
    ListUsersQuerySchema,
    LogoutSchema,
    ProcessAfterSaleSchema,
    SetUserRbacRolesSchema,
    SetUserRoleSchema,
    UpdateOrderStatusSchema,
    UpdateProductSchema,
    UpdateRoleSchema,
)
from .services.admin_service import AdminService
from .services.audit_service import AuditService
from .services.auth_service import AdminAuthService
from .services.rbac_service import RbacService
from .services.sales_service import SalesService
from .services.reco_metrics_service import RecoMetricsService


def _load_json(schema, payload):
    """
    使用 Marshmallow 校验并加载 JSON 请求体，失败时抛出业务 ValidationError。

    Args:
        schema: Marshmallow Schema 实例。
        payload: 原始请求体（dict 或 None）。

    Returns:
        dict: 校验并加载后的数据字典。

    Raises:
        ValidationError: 当请求体字段缺失、类型不符或校验失败时抛出。
    """
    try:
        return schema.load(payload or {})
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid request", error_code="validation", data={"fields": e.messages}) from e


def _load_query(schema):
    """
    使用 Marshmallow 校验并加载 Query 参数，失败时抛出业务 ValidationError。

    Args:
        schema: Marshmallow Schema 实例。

    Returns:
        dict: 校验并加载后的查询参数字典。

    Raises:
        ValidationError: 当查询参数不合法时抛出。
    """
    try:
        return schema.load(request.args.to_dict())
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid query", error_code="validation", data={"fields": e.messages}) from e


def _extract_status_code(resp):
    """
    从 Flask 返回值中提取 status_code（兼容 (json, code) 与 Response）。

    Args:
        resp: 路由函数返回值，可能是 Response，或 (payload, status_code) 元组。

    Returns:
        int: HTTP status code，解析失败时默认 200。
    """
    if isinstance(resp, tuple) and len(resp) >= 2:
        return int(resp[1] or 200)
    try:
        return int(getattr(resp, "status_code", 200) or 200)
    except Exception:
        return 200


def audit(action: str, resource_type: str | None = None, resource_id_kw: str | None = None):
    """
    审计装饰器：记录当前接口调用的轨迹到 admin_audit_logs。

    :param action: 动作标识
    :param resource_type: 资源类型（可选）
    :param resource_id_kw: 从路由参数 kwargs 中取资源ID的字段名（可选）

    Returns:
        Callable: 装饰器函数。被装饰的路由执行后将写入审计日志。

    Raises:
        Exception: 被装饰函数抛出的异常会被原样向上抛出（同时记录失败审计日志）。
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            actor_user_id = None
            if hasattr(g, "admin_user") and g.admin_user:
                actor_user_id = str(g.admin_user.get("_id"))
            resource_id = None
            if resource_id_kw and resource_id_kw in kwargs:
                resource_id = str(kwargs.get(resource_id_kw))
            try:
                resp = fn(*args, **kwargs)
                status_code = _extract_status_code(resp)
                AuditService.log(
                    actor_user_id=actor_user_id,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    success=status_code < 400,
                    status_code=status_code,
                    error=None,
                )
                return resp
            except Exception as e:
                AuditService.log(
                    actor_user_id=actor_user_id,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    success=False,
                    status_code=500,
                    error=str(e),
                )
                raise

        return wrapper

    return decorator


def admin_required(fn):
    """
    管理员身份装饰器：
    - 要求携带有效 JWT
    - 要求 user.role == admin
    - 自动初始化该管理员的 RBAC 默认绑定（若未绑定角色）

    Args:
        fn: 被装饰的 Flask view 函数。

    Returns:
        Callable: 包装后的 view 函数。

    Raises:
        UnauthorizedError: token 缺失/无效或用户不存在。
        ForbiddenError: 当前用户非管理员（user.role != admin）。
    """
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = AdminAuthService.get_admin_user()
        g.admin_user = user
        RbacService.ensure_admin_user_initialized(str(user["_id"]))
        return fn(*args, **kwargs)

    return wrapper


def require_permission(permission: str):
    """
    RBAC 权限装饰器：在 admin_required 基础上进一步校验指定 permission。

    Args:
        permission: 需要的权限名（如 admin.users.read）。

    Returns:
        Callable: 装饰器函数。被装饰 view 在执行前会进行权限校验。

    Raises:
        ForbiddenError: 用户不具备对应权限时抛出。
    """
    def decorator(fn):
        @wraps(fn)
        @admin_required
        def wrapper(*args, **kwargs):
            user_id = str(g.admin_user["_id"])
            RbacService.require(user_id, permission)
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def register_admin_routes(admin_bp):
    """
    将管理员模块所有路由注册到 Blueprint 上，并完成索引/默认数据初始化。
    """
    AdminUserDao.ensure_indexes()
    AdminProductDao.ensure_indexes()
    AdminOrderDao.ensure_indexes()
    RbacDao.ensure_indexes()
    AuditDao.ensure_indexes()
    RbacService.ensure_defaults()

    @admin_bp.route("/bootstrap", methods=["POST"])
    @audit(action="admin.bootstrap", resource_type="user")
    def bootstrap_admin():
        secret = current_app.config.get("ADMIN_BOOTSTRAP_SECRET")
        if not secret:
            return ApiResponse.error("Bootstrap disabled", 403)

        provided = request.headers.get("X-Admin-Bootstrap-Secret")
        if provided != secret:
            return ApiResponse.forbidden("Invalid bootstrap secret")

        existing_admin = mongo.db.users.count_documents({"role": "admin"}) > 0
        if existing_admin:
            return ApiResponse.error("Admin already exists", 409)

        data = _load_json(BootstrapAdminSchema(), request.get_json(silent=True))
        if mongo.db.users.find_one({"phone": data["phone"]}):
            raise ConflictError("Phone already exists")

        user_id = AdminUserDao.create_admin_user(
            username=data["username"],
            phone=data["phone"],
            password_hash=generate_password_hash(data["password"]),
        )

        RbacService.ensure_admin_user_initialized(str(user_id))
        return ApiResponse.success({"user_id": str(user_id)}, "Admin created", 201)

    @admin_bp.route("/login", methods=["POST"])
    @audit(action="admin.login", resource_type="auth")
    def admin_login():
        """
        管理员登录（仅允许 role=admin 的用户获取后台会话）。

        Body:
            - phone: 管理员手机号
            - password: 密码

        Returns:
            200: tokens + user + permissions + rbac_version
            401: 账号或密码错误
            403: 非管理员用户

        Notes:
            - 使用统一的“Invalid credentials”响应，避免泄露手机号是否存在。
        """
        data = _load_json(AdminLoginSchema(), request.get_json(silent=True))
        phone = data["phone"]
        password = data["password"]

        user = User.find_by_phone(phone)
        if not user or not User.verify_password(user.get("password_hash"), password):
            return ApiResponse.error("Invalid credentials", 401)

        if user.get("role") != "admin":
            return ApiResponse.forbidden("Admin only")

        user_id = str(user["_id"])
        RbacService.ensure_admin_user_initialized(user_id)
        perms, version = RbacService.get_user_permissions(user_id)
        tokens = JwtUtil.create_tokens(user["_id"])
        return ApiResponse.success(
            {
                "tokens": tokens,
                "user": {"username": user.get("username"), "phone": user.get("phone")},
                "permissions": sorted(list(perms)),
                "rbac_version": version,
            },
            "Login successful",
        )

    @admin_bp.route("/stats", methods=["GET"])
    @require_permission("admin.stats.read")
    @audit(action="admin.stats.read", resource_type="stats")
    def stats():
        data = AdminService.get_stats()
        return ApiResponse.success(to_safe_json(data))

    @admin_bp.route("/sales/series", methods=["GET"])
    @require_permission("admin.stats.read")
    @audit(action="admin.sales.series", resource_type="stats")
    def sales_series():
        q = _load_query(SalesSeriesQuerySchema())
        data = SalesService.series(
            granularity=q["granularity"],
            start=q.get("start"),
            end=q.get("end"),
            category=q.get("category"),
            page=int(q["page"]),
            page_size=int(q["page_size"]),
        )
        return ApiResponse.success(to_safe_json(data))

    @admin_bp.route("/sales/detail", methods=["GET"])
    @require_permission("admin.stats.read")
    @audit(action="admin.sales.detail", resource_type="stats")
    def sales_detail():
        q = _load_query(SalesDetailQuerySchema())
        data = SalesService.detail(
            granularity=q["granularity"],
            bucket=q["bucket"],
            category=q.get("category"),
            page=int(q["page"]),
            page_size=int(q["page_size"]),
        )
        return ApiResponse.success(to_safe_json(data))

    @admin_bp.route("/reco/metrics", methods=["GET"])
    @require_permission("admin.stats.read")
    @audit(action="admin.reco.metrics", resource_type="stats")
    def reco_metrics():
        days = request.args.get("days", 7)
        try:
            d = int(days)
        except Exception:
            d = 7
        data = RecoMetricsService.metrics(days=d)
        return ApiResponse.success(to_safe_json(data))

    @admin_bp.route("/users", methods=["GET"])
    @require_permission("admin.users.read")
    @audit(action="admin.users.read", resource_type="user")
    def list_users():
        q = _load_query(ListUsersQuerySchema())
        users, total = AdminUserDao.list_users(
            q=q.get("q"),
            role=q.get("role"),
            page=int(q["page"]),
            page_size=int(q["page_size"]),
            sort=q["sort"],
        )
        return ApiResponse.success(
            {
                "users": to_safe_json(users),
                "pagination": {
                    "page": q["page"],
                    "page_size": q["page_size"],
                    "total": total,
                    "total_pages": (total + q["page_size"] - 1) // q["page_size"],
                },
            }
        )

    @admin_bp.route("/users/<user_id>/role", methods=["PUT"])
    @require_permission("admin.users.set_role")
    @audit(action="admin.users.set_role", resource_type="user", resource_id_kw="user_id")
    def set_user_role(user_id):
        data = _load_json(SetUserRoleSchema(), request.get_json(silent=True))
        role = data["role"]

        updated = AdminUserDao.set_legacy_role(user_id, role)
        if not updated or updated.matched_count == 0:
            return ApiResponse.not_found("User not found")

        if role == "admin":
            RbacService.assign_default_admin_role(user_id)
        else:
            RbacDao.set_user_roles(user_id, [])
            AdminUserDao.bump_rbac_version(user_id)

        return ApiResponse.success({"user_id": user_id, "role": role}, "Role updated")

    @admin_bp.route("/me/permissions", methods=["GET"])
    @admin_required
    @audit(action="admin.me.permissions", resource_type="rbac")
    def my_permissions():
        user_id = str(g.admin_user["_id"])
        perms, version = RbacService.get_user_permissions(user_id)
        return ApiResponse.success({"permissions": sorted(list(perms)), "rbac_version": version})

    @admin_bp.route("/products", methods=["POST"])
    @require_permission("admin.products.create")
    @audit(action="admin.products.create", resource_type="product")
    def create_product():
        data = _load_json(CreateProductSchema(), request.get_json(silent=True))
        doc = {
            "name": data["name"],
            "category": data["category"],
            "price": float(data["price"]),
            "stock": int(data["stock"]),
            "description": data.get("description") or "",
            "image_url": data.get("image_url"),
            "status": data.get("status") or "on_sale",
        }
        product_id = AdminProductDao.create(doc)
        ProductStreamService.bump_version()
        return ApiResponse.success({"product_id": str(product_id)}, "Product created", 201)

    @admin_bp.route("/products/batch", methods=["POST"])
    @require_permission("admin.products.create")
    @audit(action="admin.products.batch_create", resource_type="product")
    def batch_create_products():
        data = _load_json(CreateProductBatchSchema(), request.get_json(silent=True))
        created_ids = []
        for p in data.get("products") or []:
            doc = {
                "name": p["name"],
                "category": p["category"],
                "price": float(p["price"]),
                "stock": int(p["stock"]),
                "description": p.get("description") or "",
                "image_url": p.get("image_url"),
                "status": p.get("status") or "on_sale",
            }
            created_ids.append(str(AdminProductDao.create(doc)))
        ProductStreamService.bump_version()
        return ApiResponse.success({"product_ids": created_ids}, "Products created", 201)

    @admin_bp.route("/products/<product_id>", methods=["PUT"])
    @require_permission("admin.products.update")
    @audit(action="admin.products.update", resource_type="product", resource_id_kw="product_id")
    def update_product(product_id):
        data = _load_json(UpdateProductSchema(), request.get_json(silent=True))
        updates = {k: v for k, v in data.items() if v is not None}
        if not updates:
            raise ValidationError("No updates")

        updated = AdminProductDao.update_by_id(product_id, updates)
        if not updated or updated.matched_count == 0:
            return ApiResponse.not_found("Product not found")
        ProductStreamService.bump_version()
        return ApiResponse.success({"product_id": product_id}, "Product updated")

    @admin_bp.route("/products/<product_id>", methods=["DELETE"])
    @require_permission("admin.products.delete")
    @audit(action="admin.products.delete", resource_type="product", resource_id_kw="product_id")
    def delete_product(product_id):
        deleted = AdminProductDao.delete_by_id(product_id)
        if not deleted or deleted.deleted_count == 0:
            return ApiResponse.not_found("Product not found")
        ProductStreamService.bump_version()
        return ApiResponse.success({"product_id": product_id}, "Product deleted")

    @admin_bp.route("/orders", methods=["GET"])
    @require_permission("admin.orders.read")
    @audit(action="admin.orders.read", resource_type="order")
    def list_orders():
        q = _load_query(ListOrdersQuerySchema())
        orders, total = AdminOrderDao.list_orders(
            status=q.get("status"),
            user_id=q.get("user_id"),
            page=int(q["page"]),
            page_size=int(q["page_size"]),
            sort=q["sort"],
        )
        return ApiResponse.success(
            {
                "orders": to_safe_json(orders),
                "pagination": {
                    "page": q["page"],
                    "page_size": q["page_size"],
                    "total": total,
                    "total_pages": (total + q["page_size"] - 1) // q["page_size"],
                },
            }
        )

    @admin_bp.route("/orders/<order_id>/status", methods=["PUT"])
    @require_permission("admin.orders.update_status")
    @audit(action="admin.orders.update_status", resource_type="order", resource_id_kw="order_id")
    def update_order_status(order_id):
        data = _load_json(UpdateOrderStatusSchema(), request.get_json(silent=True))
        status = data["status"]
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
            "after_sale_rejected",
        }
        if status not in allowed:
            raise ValidationError("Invalid status")

        updated = Order.update_status(order_id, status)
        if not updated or updated.matched_count == 0:
            return ApiResponse.not_found("Order not found")
        return ApiResponse.success({"order_id": order_id, "status": status}, "Status updated")

    @admin_bp.route("/orders/<order_id>/after_sale", methods=["PUT"])
    @require_permission("admin.orders.process_after_sale")
    @audit(action="admin.orders.process_after_sale", resource_type="order", resource_id_kw="order_id")
    def process_after_sale(order_id):
        data = _load_json(ProcessAfterSaleSchema(), request.get_json(silent=True))
        updated = Order.process_after_sale(order_id, data["status"], remark=data.get("remark"))
        if not updated or updated.matched_count == 0:
            return ApiResponse.not_found("Order not found")
        return ApiResponse.success({"order_id": order_id, "status": data["status"]}, "After-sale processed")

    @admin_bp.route("/rbac/permissions", methods=["GET"])
    @require_permission("admin.rbac.manage")
    @audit(action="admin.rbac.permissions.list", resource_type="rbac")
    def list_permissions():
        return ApiResponse.success({"permissions": to_safe_json(RbacService.list_permissions())})

    @admin_bp.route("/rbac/roles", methods=["GET"])
    @require_permission("admin.rbac.manage")
    @audit(action="admin.rbac.roles.list", resource_type="rbac")
    def list_roles():
        return ApiResponse.success({"roles": to_safe_json(RbacService.list_roles())})

    @admin_bp.route("/rbac/roles", methods=["POST"])
    @require_permission("admin.rbac.manage")
    @audit(action="admin.rbac.roles.create", resource_type="rbac")
    def create_role():
        data = _load_json(CreateRoleSchema(), request.get_json(silent=True))
        role_id = RbacService.create_role(data["name"], data.get("description", ""), data["perm_names"])
        return ApiResponse.success({"role_id": str(role_id)}, "Role created", 201)

    @admin_bp.route("/rbac/roles/<role_id>", methods=["PUT"])
    @require_permission("admin.rbac.manage")
    @audit(action="admin.rbac.roles.update", resource_type="rbac", resource_id_kw="role_id")
    def update_role(role_id):
        data = _load_json(UpdateRoleSchema(), request.get_json(silent=True))
        updated = RbacService.update_role(
            role_id=role_id,
            name=data.get("name"),
            description=data.get("description"),
            perm_names=data.get("perm_names"),
        )
        if not updated or updated.matched_count == 0:
            return ApiResponse.not_found("Role not found")
        return ApiResponse.success({"role_id": role_id}, "Role updated")

    @admin_bp.route("/rbac/roles/<role_id>", methods=["DELETE"])
    @require_permission("admin.rbac.manage")
    @audit(action="admin.rbac.roles.delete", resource_type="rbac", resource_id_kw="role_id")
    def delete_role(role_id):
        deleted = RbacService.delete_role(role_id)
        if not deleted or deleted.deleted_count == 0:
            return ApiResponse.not_found("Role not found")
        return ApiResponse.success({"role_id": role_id}, "Role deleted")

    @admin_bp.route("/users/<user_id>/rbac_roles", methods=["PUT"])
    @require_permission("admin.users.set_rbac_roles")
    @audit(action="admin.users.set_rbac_roles", resource_type="user", resource_id_kw="user_id")
    def set_user_rbac_roles(user_id):
        data = _load_json(SetUserRbacRolesSchema(), request.get_json(silent=True))
        roles = RbacService.set_user_roles(user_id, data["role_ids"])
        return ApiResponse.success({"user_id": user_id, "roles": to_safe_json(roles)}, "Roles updated")

    @admin_bp.route("/audit", methods=["GET"])
    @require_permission("admin.audit.read")
    @audit(action="admin.audit.read", resource_type="audit")
    def list_audit_logs():
        q = _load_query(ListAuditLogsQuerySchema())
        logs, total = AuditDao.list_logs(
            actor_user_id=q.get("actor_user_id"),
            action=q.get("action"),
            resource_type=q.get("resource_type"),
            resource_id=q.get("resource_id"),
            page=int(q["page"]),
            page_size=int(q["page_size"]),
        )
        return ApiResponse.success(
            {
                "logs": to_safe_json(logs),
                "pagination": {
                    "page": q["page"],
                    "page_size": q["page_size"],
                    "total": total,
                    "total_pages": (total + q["page_size"] - 1) // q["page_size"],
                },
            }
        )

    @admin_bp.route("/logout", methods=["POST"])
    @admin_required
    @audit(action="admin.logout", resource_type="auth")
    def admin_logout():
        data = _load_json(LogoutSchema(), request.get_json(silent=True))
        payload = get_jwt()
        jti = payload.get("jti")
        exp = payload.get("exp")
        try:
            if extensions.redis_client is not None and jti and exp:
                ttl = max(int(exp - time.time()), 1)
                extensions.redis_client.setex(f"bl:{jti}", ttl, "1")
        except Exception:
            pass

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
