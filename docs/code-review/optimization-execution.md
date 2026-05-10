# 项目优化方案（已执行）

## 1. 优先级排序（基于审查报告）

输入来源：
- [final-report.md](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/docs/code-review/final-report.md)
- [tasks.md](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/docs/code-review/tasks.md)
- 自动化扫描： [findings.csv](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/docs/code-review/findings.csv)

分级原则：
- 高：可被利用的安全隐患、会话接管风险、并发数据一致性/重复数据、导致崩溃或不可用的缺陷
- 中：明显性能瓶颈（N+1/全量物化/慢查询）、复杂度过高模块
- 低：可读性/一致性/注释与文档补齐

## 2. 高优先级（已实施）

### 2.1 会话安全：JWT Cookie + CSRF 防护（替代 localStorage token）

- 后端启用 cookies 作为 JWT token location（兼容 header）并开启 CSRF 保护：
  - [config.py](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/backend/app/config.py)
  - CORS 支持携带 cookie： [extensions.py](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/backend/app/extensions.py)
- 登录接口写入 access/refresh cookie；登出接口清理 cookie：
  - 用户： [user.py](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/backend/app/routes/user.py)
  - 管理员： [controllers.py](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/backend/app/admin_v2/controllers.py)
- 前端切换为 `withCredentials` 并为非 GET 请求自动附加 `X-CSRF-TOKEN`：
  - [http.ts](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/frontend/src/api/http.ts)
  - 登录/注册页不再写入 token 到 localStorage（改为后端 Set-Cookie）：UserLogin/UserRegister/AdminLogin

回归点：
- 用户端：登录/注册/个人中心/下单/保养预约/活动报名
- 管理端：登录/权限拉取/列表操作（涉及 POST/PUT/DELETE 的 CSRF）
- 旧客户端兼容：Authorization header 仍可用（对接 runner/脚本不受影响）

### 2.2 数据一致性：用户手机号唯一索引 + 注册竞态处理

- 建立 users.phone 唯一索引： [user_model.py](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/backend/app/models/user_model.py)
- App 启动确保索引： [__init__.py](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/backend/app/__init__.py)
- 注册接口捕获 DuplicateKeyError 并返回 409： [user.py](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/backend/app/routes/user.py)

### 2.3 公共写接口防滥用：推荐事件上报限流 + body 限制

- /api/product/reco/event：
  - body 大小限制（12KB）
  - Redis 可用时按 anon_id/user_id 进行 60s 窗口计数限流（>120/min 返回 429）
  - 代码： [product.py](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/backend/app/routes/product.py)

## 3. 中优先级（已实施）

### 3.1 消除购物车 N+1（前端网络与整体响应时间显著优化）

- 后端增强 `/api/cart/items`：返回 `products` map（product snapshot）以支持一次请求渲染购物车
  - [cart.py](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/backend/app/routes/cart.py)
- 新增批量产品接口 `/api/product/batch?ids=...`（作为兜底/通用能力）
  - [product.py](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/backend/app/routes/product.py)
- 前端 cart store 优先使用 `cart/items` 的 `products`，无则走 `product/batch`；不再逐个 `product/:id`
  - [cart.ts](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/frontend/src/stores/cart.ts)

## 4. 低优先级（本轮部分完成）

- 路由与组件改造：从 token 本地判断切换为“后端验真”（userAuth/adminAuth store）
  - [userAuth.ts](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/frontend/src/stores/userAuth.ts)
  - [adminAuth.ts](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/frontend/src/stores/adminAuth.ts)
- 部分页面 token 判断替换：ProductDetail/Cart/Recommendations/ActivityDetail/ProductCard/UserCenter/Header 等

## 5. 测试用例与回归执行记录

### 5.1 单元测试

- 后端：`pytest -q tests/test_activity.py tests/test_maintenance.py` 通过
- 前端：`npm --prefix frontend test`（vitest）通过（61/61）

### 5.2 集成测试

- 对接 runner：`tools/api-integration-runner.mjs`（兼容 header token）保持可用

### 5.3 回归测试计划

- 登录/刷新/登出：
  - 用户与管理员分别验证 cookies 写入与 CSRF header
  - 401 时自动 refresh + 重放请求（前端拦截器）
- 购物车链路：
  - /cart 页面仅产生 1 次 cart/items 请求（不产生 N 次 product/:id）
  - 购物车增删改查与下单回归
- 安全回归：
  - 事件上报限流：触发阈值返回 429 且不写库
  - 生产配置门禁：生产环境缺失 secret/CORS 不允许启动

## 6. 性能基准与对比报告

### 6.1 API 基准（聚合）

- before：`audit/bench/api-integration/run-1777892569284/bench.json`
- after：`audit/bench/api-integration/run-1777894710386/bench.json`

### 6.2 购物车链路基准（满足 ≥20% 改善）

- 脚本： [cart_flow_bench.mjs](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/tools/bench/cart_flow_bench.mjs)
- 结果：oldFlow=20ms → newFlow=8ms，改善 60%（见 `audit/bench/cart-flow/run-1777894854969/bench.md`）

## 7. 安全扫描

- 前端：`npm --prefix frontend audit --json` 显示 0 漏洞
- 后端：建议补齐 `pip-audit`（或安全扫描等价工具）作为 CI 门禁项

