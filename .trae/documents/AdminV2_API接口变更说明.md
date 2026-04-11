# 管理员后台 V2 - API 接口变更说明

## 0. 目标
- 支持 RBAC 细粒度权限校验
- 支持服务端分页/筛选/排序/批量操作
- 支持操作审计日志与权限审计

## 1. 兼容策略
1) 现有 `/api/admin/*` 保持可用，逐步在 V2 中扩展 query 参数与分页返回。  
2) 现有 `role=admin` 可作为“默认超级管理员”迁移路径：首次迁移时为 admin 用户自动绑定 super_admin 角色。  

## 2. 新增接口（建议）
### 2.1 RBAC
- `GET /api/admin/roles`：角色列表（分页）
- `POST /api/admin/roles`：创建角色
- `PUT /api/admin/roles/:role_id`：更新角色
- `DELETE /api/admin/roles/:role_id`：删除角色（需保护）
- `GET /api/admin/permissions`：权限点列表
- `PUT /api/admin/roles/:role_id/permissions`：为角色配置权限点（覆盖式）
- `GET /api/admin/users/:user_id/roles`：查看用户角色
- `PUT /api/admin/users/:user_id/roles`：设置用户角色（覆盖式/增量式二选一）

### 2.2 审计日志
- `GET /api/admin/audit_logs`：审计日志查询（支持 actor/资源/时间范围/结果筛选）
- `GET /api/admin/audit_logs/:id`：审计详情（before/after diff）

### 2.3 内容审核（若落地）
- `GET /api/admin/reviews`：评价列表（筛选：状态/时间/关键词）
- `PUT /api/admin/reviews/:id/decision`：approve/reject + 备注

## 3. 修改接口（现有增强）
### 3.1 用户管理
现有：`GET /api/admin/users`（全量）  
修改为（兼容默认值）：
- `GET /api/admin/users?page=1&page_size=20&q=...&role=...&status=...&sort=created_at_desc`
返回新增：
```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "users": [],
    "pagination": { "page": 1, "page_size": 20, "total": 123, "total_pages": 7 }
  }
}
```

现有：`PUT /api/admin/users/:id/role`  
建议调整：
- `PUT /api/admin/users/:id/roles`（更符合 RBAC 多角色）
- 或保留旧接口作为“快捷切换”，新接口作为正式配置入口

### 3.2 商品管理
现有：`POST/PUT/DELETE /api/admin/products...`  
增强：
- `GET /api/admin/products?page=&page_size=&q=&category=&status=&min_price=&max_price=&sort=`（后台列表改走后台接口，避免复用前台 list）
- `PUT /api/admin/products/batch`：批量上下架/改分类/改库存

### 3.3 订单管理与售后
现有：`GET /api/admin/orders`（全量）  
修改为：
- `GET /api/admin/orders?page=&page_size=&q=&status=&after_sale_status=&time_from=&time_to=&sort=`
现有：`PUT /api/admin/orders/:id/status`  
增强：
- 服务端校验状态机合法流转
- 支持批量：`PUT /api/admin/orders/batch/status`
现有：`PUT /api/admin/orders/:id/after_sale`  
增强：
- 支持记录处理人/处理备注/证据链接（可选）

## 4. 字段与序列化规范（必须）
- 所有 `_id`、`user_id`、`product_id` 统一转字符串输出
- 所有 datetime 统一转 ISO8601 字符串输出（例如 `2026-04-09T10:42:17`）
- 请求与响应统一 envelope：`{code,message,data}`

## 5. 错误码建议
- 400：参数错误（Invalid query/body）
- 401：未登录/Token 失效
- 403：无权限（RBAC 拒绝）
- 404：资源不存在
- 409：冲突（如 bootstrap/admin 已存在、重复角色 code）
- 422：状态机不允许的操作（如非法状态流转）
