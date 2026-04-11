# RBAC 权限模型与分级体系（管理员后台 V2）

## 1. 数据模型（MongoDB 建议）
### 1.1 collections
- users
  - _id, username, phone, password_hash
  - status: active|disabled（新增）
  - created_at, updated_at
- roles
  - _id, name, code（唯一，例如 super_admin）
  - description
  - created_at, updated_at
- permissions
  - _id, code（唯一，例如 order.update_status）
  - resource（order）
  - action（update_status）
  - description
  - created_at, updated_at
- role_permissions
  - _id, role_id, permission_id
- user_roles
  - _id, user_id, role_id
- audit_logs（操作审计）
  - _id, actor_id, actor_roles[], action_code
  - resource, target_id
  - before, after（json diff）
  - result: success|fail, error_message
  - ip, user_agent, request_id
  - created_at

## 2. 权限点命名规范
`{resource}.{action}`
- resource：dashboard/user/role/permission/product/order/after_sale/review/audit_log/system
- action：read/create/update/delete/export/assign/approve/reject/ship/update_status

示例：
- user.read
- user.assign_role
- product.update
- product.publish
- product.archive
- order.read
- order.update_status
- order.ship
- after_sale.approve
- after_sale.reject
- audit_log.read
- role.manage
- permission.manage

## 3. 角色定义（建议默认内置）
| 角色 | code | 职责 | 权限范围（示例） |
|---|---|---|---|
| 超级管理员 | super_admin | 最高权限、配置、审计 | `*`（或所有权限点） |
| 运营管理员 | ops_admin | 用户运营、售后、基础统计 | user.read、user.assign_role(受限)、after_sale.*、dashboard.read |
| 商品管理员 | product_admin | 商品全生命周期 | product.*、dashboard.read |
| 订单管理员 | order_admin | 订单处理 | order.read、order.update_status、order.ship、after_sale.read |
| 审核员 | reviewer | 评价/内容审核 | review.read、review.approve/reject、dashboard.read(受限) |
| 数据分析员 | analyst | 只读统计与导出 | dashboard.read、order.export、product.export、user.export |

## 4. 授权规则与约束
- 1 个用户可以拥有多个角色；权限为并集。
- “最后一个 super_admin 保护”：禁止将系统最后一个 super_admin 降级或禁用。
- “自我保护”：禁止管理员给自己分配/移除 super_admin（仅更高权限者可操作）。
- “敏感操作二次确认”：删除商品、批量改角色、批量改订单状态、处理售后需二次确认 + 记录原因。

## 5. 服务端校验策略（规范）
- 路由层统一：`@jwt_required()` → `require_permissions(['order.read'])`
- `require_permissions` 从 user_roles → role_permissions → permissions 聚合得到权限点集合
- 命中则放行；否则返回 403（统一错误码/错误文案）

## 6. 前端表现
- 菜单按权限点动态展示（无权限则隐藏/禁用）
- 接口 403：展示“无权限”占位 + 引导联系超级管理员申请权限
- 审计日志页：只对 `audit_log.read` 放开
