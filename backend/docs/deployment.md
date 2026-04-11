# 部署说明（后端）

## 环境变量

- `SECRET_KEY`：Flask 密钥
- `MONGO_URI`：MongoDB 连接串（默认 `mongodb://localhost:27017/hearing_aid_mall`）
- `JWT_SECRET_KEY`：JWT 签名密钥
- `REDIS_URL`：Redis 连接串（默认 `redis://localhost:6379/0`）
- `ADMIN_BOOTSTRAP_SECRET`：启用管理员初始化接口 `/api/admin/bootstrap` 的密钥（为空则禁用）

## MongoDB 索引初始化

应用在管理员模块加载时会尝试创建索引（幂等调用）：

- `users`：`phone(unique)`、`role`、`created_at`
- `products`：`category`、`created_at`、`name`
- `orders`：`status`、`created_at`、`user_id`
- `admin_permissions`：`name(unique)`
- `admin_roles`：`name(unique)`
- `admin_user_roles`：`user_id(unique)`
- `admin_audit_logs`：`created_at`、`actor_user_id+created_at`、`action+created_at`、`resource_type+resource_id+created_at`

如果历史数据存在重复手机号等情况，唯一索引可能创建失败（会被捕获并跳过），建议在生产环境上线前完成数据清洗与索引检查。

## Redis 使用说明

Redis 用于：

- JWT 黑名单（登出立即失效）
- RBAC 权限缓存（降低重复查询开销）
- 后台统计缓存（降低聚合开销）

当 Redis 不可用时：

- 黑名单校验将退化为“不可用”（登出无法保证立即失效）
- 缓存机制自动失效但不影响接口可用性（回退到 MongoDB 查询）

生产建议强制启用 Redis，并纳入健康检查与告警。

## 启动方式（示例）

在后端目录安装依赖并启动：

- `pip install -r requirements.txt`
- 使用你现有的启动方式运行 Flask（例如通过 WSGI/ASGI 或直接运行应用入口）

建议生产环境使用反向代理（Nginx）并启用 HTTPS，限制管理端来源 IP（如可行），并开启安全审计日志保留策略。

