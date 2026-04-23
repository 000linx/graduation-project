from __future__ import annotations

"""
管理员模块请求参数校验（Schemas）。

使用 Marshmallow 对管理端接口的 Body 与 Query 参数进行结构化校验。
"""

from marshmallow import Schema, fields, validate


class BootstrapAdminSchema(Schema):
    """
    /api/admin/bootstrap 请求体校验。
    """
    username = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    phone = fields.Str(required=True, validate=validate.Regexp(r"^\d{6,20}$"))
    password = fields.Str(required=True, validate=validate.Length(min=6, max=128))


class ListUsersQuerySchema(Schema):
    """
    /api/admin/users 查询参数校验。
    """
    q = fields.Str(load_default=None)
    role = fields.Str(load_default=None, validate=validate.OneOf(["user", "admin"]))
    page = fields.Int(load_default=1, validate=validate.Range(min=1, max=100000))
    page_size = fields.Int(load_default=20, validate=validate.Range(min=1, max=200))
    sort = fields.Str(load_default="created_at_desc", validate=validate.OneOf(["created_at_asc", "created_at_desc", "username_asc", "username_desc"]))


class SetUserRoleSchema(Schema):
    """
    /api/admin/users/<user_id>/role 请求体校验。
    """
    role = fields.Str(required=True, validate=validate.OneOf(["user", "admin"]))


class CreateProductSchema(Schema):
    """
    /api/admin/products（POST）请求体校验。
    """
    name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    category = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    price = fields.Float(required=True, validate=validate.Range(min=0))
    stock = fields.Int(required=True, validate=validate.Range(min=0))
    description = fields.Str(load_default="")
    image_url = fields.Str(load_default=None, allow_none=True)
    status = fields.Str(load_default="on_sale", validate=validate.OneOf(["on_sale", "off_sale"]))


class UpdateProductSchema(Schema):
    """
    /api/admin/products/<product_id>（PUT）请求体校验。
    """
    name = fields.Str(load_default=None, allow_none=True, validate=validate.Length(min=1, max=200))
    category = fields.Str(load_default=None, allow_none=True, validate=validate.Length(min=1, max=50))
    price = fields.Float(load_default=None, allow_none=True, validate=validate.Range(min=0))
    stock = fields.Int(load_default=None, allow_none=True, validate=validate.Range(min=0))
    description = fields.Str(load_default=None, allow_none=True)
    image_url = fields.Str(load_default=None, allow_none=True)
    status = fields.Str(load_default=None, allow_none=True, validate=validate.OneOf(["on_sale", "off_sale"]))


class CreateProductBatchSchema(Schema):
    products = fields.List(fields.Nested(CreateProductSchema), required=True, validate=validate.Length(min=1, max=200))


class ListOrdersQuerySchema(Schema):
    """
    /api/admin/orders 查询参数校验。
    """
    status = fields.Str(load_default=None)
    user_id = fields.Str(load_default=None)
    page = fields.Int(load_default=1, validate=validate.Range(min=1, max=100000))
    page_size = fields.Int(load_default=20, validate=validate.Range(min=1, max=200))
    sort = fields.Str(load_default="created_at_desc", validate=validate.OneOf(["created_at_asc", "created_at_desc"]))


class UpdateOrderStatusSchema(Schema):
    """
    /api/admin/orders/<order_id>/status 请求体校验。
    """
    status = fields.Str(required=True)


class ProcessAfterSaleSchema(Schema):
    """
    /api/admin/orders/<order_id>/after_sale 请求体校验。
    """
    status = fields.Str(required=True, validate=validate.OneOf(["approved", "rejected"]))
    remark = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=500))


class LogoutSchema(Schema):
    """
    /api/admin/logout 请求体校验。
    """
    refresh_token = fields.Str(load_default=None, allow_none=True)


class CreateRoleSchema(Schema):
    """
    /api/admin/rbac/roles（POST）请求体校验。
    """
    name = fields.Str(required=True, validate=validate.Regexp(r"^[a-z0-9_]{2,40}$"))
    description = fields.Str(load_default="")
    perm_names = fields.List(fields.Str(), required=True, validate=validate.Length(min=1, max=200))


class UpdateRoleSchema(Schema):
    """
    /api/admin/rbac/roles/<role_id>（PUT）请求体校验。
    """
    name = fields.Str(load_default=None, allow_none=True, validate=validate.Regexp(r"^[a-z0-9_]{2,40}$"))
    description = fields.Str(load_default=None, allow_none=True)
    perm_names = fields.List(fields.Str(), load_default=None, allow_none=True, validate=validate.Length(min=1, max=200))


class SetUserRbacRolesSchema(Schema):
    """
    /api/admin/users/<user_id>/rbac_roles 请求体校验。
    """
    role_ids = fields.List(fields.Str(), required=True, validate=validate.Length(min=0, max=50))


class ListAuditLogsQuerySchema(Schema):
    """
    /api/admin/audit 查询参数校验。
    """
    actor_user_id = fields.Str(load_default=None)
    action = fields.Str(load_default=None)
    resource_type = fields.Str(load_default=None)
    resource_id = fields.Str(load_default=None)
    page = fields.Int(load_default=1, validate=validate.Range(min=1, max=100000))
    page_size = fields.Int(load_default=20, validate=validate.Range(min=1, max=200))


class SalesSeriesQuerySchema(Schema):
    granularity = fields.Str(
        load_default="day",
        validate=validate.OneOf(["day", "week", "month", "quarter", "year"]),
    )
    start = fields.Str(load_default=None, allow_none=True)
    end = fields.Str(load_default=None, allow_none=True)
    category = fields.Str(load_default=None, allow_none=True)
    page = fields.Int(load_default=1, validate=validate.Range(min=1, max=100000))
    page_size = fields.Int(load_default=50, validate=validate.Range(min=1, max=500))


class SalesDetailQuerySchema(Schema):
    granularity = fields.Str(
        load_default="day",
        validate=validate.OneOf(["day", "week", "month", "quarter", "year"]),
    )
    bucket = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    category = fields.Str(load_default=None, allow_none=True)
    page = fields.Int(load_default=1, validate=validate.Range(min=1, max=100000))
    page_size = fields.Int(load_default=20, validate=validate.Range(min=1, max=200))
