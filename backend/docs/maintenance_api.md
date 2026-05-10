# 助听器保养预约系统 API（REST）

## 通用约定

- Base URL：`/api`
- 认证：Bearer Token
  - 用户端：`Authorization: Bearer <access_token>`
  - 管理端：`Authorization: Bearer <admin_access_token>`
- 统一响应：`{ code, message, data }`

## 用户端（/api/maintenance）

### 1) 获取可预约的订单（已购买）

`GET /api/maintenance/eligible`

返回：
- `order_id/status/created_at/total_amount/items[]`

### 2) 获取推荐可预约时段

`GET /api/maintenance/slots?date=YYYY-MM-DD&limit=16`

返回：
- `slots[]: { start, end, score }`

说明：
- start/end 为 ISO 字符串（分钟粒度）
- 仅返回未与现有预约冲突的时段

### 3) 创建预约

`POST /api/maintenance/appointments`

Body：
```json
{
  "order_id": "string",
  "product_id": "string",
  "contact_name": "string",
  "contact_phone": "string",
  "preferred_start": "2026-05-02T10:30",
  "notes": "string(optional)"
}
```

状态：
- `pending`：待确认
- `confirmed`：已确认
- `completed`：已完成
- `cancelled`：已取消
- `rejected`：已拒绝

### 4) 查询我的预约

`GET /api/maintenance/appointments?page=1&page_size=20`

### 5) 修改预约（仅待确认可改联系信息/备注）

`PUT /api/maintenance/appointments/<appointment_id>`

### 6) 取消预约

`POST /api/maintenance/appointments/<appointment_id>/cancel`

### 7) 查询历史保养记录

`GET /api/maintenance/records?page=1&page_size=20`

### 8) 导出保养记录 PDF

`GET /api/maintenance/records/<record_id>/pdf`

### 9) 查询站内通知（预约状态变更）

`GET /api/maintenance/notifications?page=1&page_size=20`

## 管理端（/api/admin/maintenance）

权限：
- `admin.maintenance.read`：查看
- `admin.maintenance.manage`：确认/拒绝/改期/完成/批量/导出

### 1) 查询预约（支持筛选）

`GET /api/admin/maintenance/appointments?user_id=&status=&start=&end=&page=&page_size=`

### 2) 预约详情 + 用户历史记录

`GET /api/admin/maintenance/appointments/<appointment_id>`

返回：
- `appointment`
- `history`（该用户最近 20 条保养记录）
- `record`（若该预约已完成）

### 3) 确认预约

`POST /api/admin/maintenance/appointments/<appointment_id>/confirm`

### 4) 拒绝预约

`POST /api/admin/maintenance/appointments/<appointment_id>/reject`

Body：
```json
{ "reason": "string" }
```

### 5) 改期

`POST /api/admin/maintenance/appointments/<appointment_id>/reschedule`

Body：
```json
{ "new_start": "2026-05-02T10:30" }
```

### 6) 完成并生成保养记录

`POST /api/admin/maintenance/appointments/<appointment_id>/complete`

Body（示例）：
```json
{
  "technician": { "name": "张三" },
  "items": [{ "name": "清洁调试", "fee": 50 }],
  "replaced_parts": [{ "name": "耳塞", "qty": 1, "unit_price": 30 }],
  "total_cost": 80,
  "report": "本次完成清洁与调试。"
}
```

### 7) 批量操作

`POST /api/admin/maintenance/appointments/batch`

Body：
```json
{
  "action": "confirm|reject|cancel",
  "ids": ["id1","id2"],
  "reason": "string(optional)"
}
```

### 8) 导出记录 PDF

`GET /api/admin/maintenance/records/<record_id>/pdf`
