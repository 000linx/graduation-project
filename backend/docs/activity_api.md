# 活动管理模块 API（REST）

## 统一响应

- `{ code, msg, message, data }`
- 前端优先使用 `msg`，并兼容旧字段 `message`

## 公共端（/api/activity）

### 活动列表

`GET /api/activity/list`

Query：
- `q`：搜索关键词（活动名称/副标题）
- `status`：`not_started|ongoing|ended`
- `start/end`：ISO 时间范围（可选）
- `sort_by`：`created_at|start_at`
- `sort_dir`：`1|-1`
- `page/page_size`

### 活动详情

`GET /api/activity/<activity_id>`

### 报名

`POST /api/activity/<activity_id>/register`（需登录）

Body：
```json
{
  "ticket_tier_id": "string(optional when paid)",
  "answers": { "field_id": "value" }
}
```

## 管理端（/api/admin/activities）

权限：
- `admin.activities.read`
- `admin.activities.manage`

### 列表（分页/搜索/排序）

`GET /api/admin/activities`

Query：
- `q/status/start/end/sort_by/sort_dir/page/page_size`

### 新建草稿

`POST /api/admin/activities`

### 详情

`GET /api/admin/activities/<activity_id>`

### 自动保存草稿（30s）

`PUT /api/admin/activities/<activity_id>/draft`

说明：
- 该接口不做强制完整校验，用于自动保存草稿

### 保存（完整校验 + 生成版本）

`PUT /api/admin/activities/<activity_id>`

校验失败返回：
```json
{
  "code": 400,
  "msg": "Validation failed",
  "data": { "fields": { "start_at": "Required" } }
}
```

### 发布

`POST /api/admin/activities/<activity_id>/publish`

Body：
```json
{ "mode": "now" }
```
或
```json
{ "mode": "schedule", "publish_at": "2026-05-01T20:00" }
```

### 下架

`POST /api/admin/activities/<activity_id>/offline`

### 版本历史

`GET /api/admin/activities/<activity_id>/versions`

### 回滚

`POST /api/admin/activities/<activity_id>/rollback`

Body：
```json
{ "version_id": "string" }
```

## 审计

- 管理端所有接口调用轨迹：`admin_audit_logs`（通用审计）
- 敏感操作（发布/下架/回滚）：`admin_activity_log`（活动模块专用审计）

