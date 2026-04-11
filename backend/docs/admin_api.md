# 管理员模块 API（/api/admin）

## 通用约定

- 认证：`Authorization: Bearer <access_token>`
- 统一返回：
  - `code`：HTTP 状态码
  - `message`：提示信息
  - `data`：业务数据
- 错误补充信息（可选）：当触发业务异常/校验失败时，`data.error_code` 与 `data.fields` 可能出现（用于前端精确提示）。

## RBAC 权限模型

- 权限字符串：`admin.<resource>.<action>`，例如 `admin.users.read`
- 角色：包含 `perm_names`（权限列表，支持 `"*"` 表示全权限）
- 用户与角色：通过 `admin_user_roles` 绑定
- 默认内置角色：
  - `super_admin`：`["*"]`
  - `admin_basic`：管理员模块默认全量权限集
  - `audit_viewer`：仅 `admin.audit.read`

## 管理员初始化

### POST /bootstrap

用于创建首个管理员（仅允许一次）。

- Header：`X-Admin-Bootstrap-Secret: <ADMIN_BOOTSTRAP_SECRET>`
- Body：
  - `username` string
  - `phone` string
  - `password` string

响应：`201`，`data.user_id`

## 概览统计

### GET /stats

- 权限：`admin.stats.read`
- 响应：`data.users / data.products / data.orders / data.total_sales`

## 用户管理

### GET /users

- 权限：`admin.users.read`
- Query：
  - `q`：用户名/手机号模糊搜索
  - `role`：`user|admin`
  - `page`：默认 1
  - `page_size`：默认 20
  - `sort`：`created_at_asc|created_at_desc|username_asc|username_desc`
- 响应：`data.users` + `data.pagination`

### PUT /users/{user_id}/role

- 权限：`admin.users.set_role`
- Body：`{ "role": "user" | "admin" }`
- 说明：当设置为 `admin` 时，会自动分配 `admin_basic` RBAC 角色；当设置回 `user` 时，会清空 RBAC 角色绑定。

### PUT /users/{user_id}/rbac_roles

- 权限：`admin.users.set_rbac_roles`
- Body：`{ "role_ids": ["..."] }`

## 商品管理

### POST /products

- 权限：`admin.products.create`
- Body：`{ name, category, price, stock, description?, image_url? }`

### PUT /products/{product_id}

- 权限：`admin.products.update`
- Body：可选字段的部分更新（至少包含 1 个字段）。

### DELETE /products/{product_id}

- 权限：`admin.products.delete`

## 订单管理

### GET /orders

- 权限：`admin.orders.read`
- Query：
  - `status`：订单状态过滤
  - `user_id`：按用户过滤
  - `page/page_size/sort`：同上（sort 支持 created_at_asc/desc）

### PUT /orders/{order_id}/status

- 权限：`admin.orders.update_status`
- Body：`{ "status": "pending|paid|shipped|delivered|completed|cancel_requested|cancelled|after_sale_pending|after_sale_approved|after_sale_rejected" }`

### PUT /orders/{order_id}/after_sale

- 权限：`admin.orders.process_after_sale`
- Body：`{ "status": "approved|rejected", "remark"?: "..." }`

## RBAC 管理

### GET /rbac/permissions

- 权限：`admin.rbac.manage`

### GET /rbac/roles

- 权限：`admin.rbac.manage`

### POST /rbac/roles

- 权限：`admin.rbac.manage`
- Body：`{ name, description?, perm_names }`

### PUT /rbac/roles/{role_id}

- 权限：`admin.rbac.manage`
- Body：`{ name?, description?, perm_names? }`

### DELETE /rbac/roles/{role_id}

- 权限：`admin.rbac.manage`

### GET /me/permissions

- 权限：仅需管理员身份
- 响应：`data.permissions`（当前用户权限列表）与 `data.rbac_version`

## 审计日志

### GET /audit

- 权限：`admin.audit.read`
- Query：
  - `actor_user_id`
  - `action`
  - `resource_type`
  - `resource_id`
  - `page/page_size`
- 响应：`data.logs` + `data.pagination`

## 登出

### POST /logout

将 access_token（可选 refresh_token）加入黑名单，使其立即失效。

- Body：`{ "refresh_token"?: "..." }`

