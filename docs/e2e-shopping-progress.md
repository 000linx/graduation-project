# 购物流程 E2E 开发与验证进展

## 1. 本轮完成内容

- 完成 Playwright 执行链路稳定化：
  - 修复 Windows 下 runner 启动与命令调用问题（前后端服务拉起、Playwright 执行、报告生成）。
  - 修复 `playwright-results.json` 解析逻辑，支持 `specs/tests` 结构与失败信息提取。
- 完成购物主流程脚本稳定性改造：
  - 通过 `orderId` 精确定位订单行，消除“详情/支付/确认收货/售后”按钮歧义。
  - 将移动端搜索改为 `/?q=` 路由查询驱动，避免仅桌面可见搜索框导致的不可见错误。
  - 收敛弹窗交互（确认收货、评价、售后）到对话框上下文，减少严格模式冲突。
- 完成并发场景稳定性改造：
  - 并发用户注册手机号改为随机生成，避免高并发下注册冲突。
  - 并发下单链路统一使用稳定 `data-testid` 与显式断言。
- 完成可测试性增强（前端）：
  - 在首页搜索、头部购物车、商品卡、商品详情加购、购物车结算、订单操作按钮等关键节点增加 `data-testid`。

## 2. 关键实现变更

### 2.1 E2E 脚本

- `frontend/e2e/shopping-flow.spec.ts`
  - 订单定位改为按 `orderId` 行级定位。
  - 支付、状态推进、物流展示、确认收货、评价、售后流程均已串联并断言。
  - 移动端场景不再依赖桌面搜索输入，使用 URL query 驱动筛选。
- `frontend/e2e/concurrency.spec.ts`
  - 并发用例改为稳定选择器链路，三用户并行下单可复现通过。
- `frontend/e2e/helpers.ts`
  - 补充封面进入逻辑、随机手机号生成与地址管理辅助流程。

### 2.2 前端页面可测性

- `frontend/src/components/Header.vue`
- `frontend/src/components/ProductCard.vue`
- `frontend/src/views/ProductDetail.vue`
- `frontend/src/views/Cart.vue`
- `frontend/src/views/Checkout.vue`
- `frontend/src/views/UserCenter.vue`

以上文件均增加了 E2E 关键节点的 `data-testid`，用于降低 UI 文案/布局变化导致的脚本波动。

### 2.3 报告生成

- `tools/e2e-shopping/generate_report.mjs`
  - 支持从 Playwright attachment 的 `body(base64)` 解码性能数据。
  - 修复后可正常统计页面加载与接口响应 p50/p95。

## 3. 测试执行与结果

- 全量 E2E（PC+移动，含并发）：
  - `8 passed / 8 total`
  - 报告：`test-reports/e2e-shopping/report.md`
- 后端回归：
  - `python -m pytest backend/tests/test_activity.py backend/tests/test_maintenance.py -q`
  - 结果：`8 passed`
- 前端单测（针对本次修改关联）：
  - `npm run test -- src/tests/routerGuard.spec.ts`
  - 结果：`5 passed`

## 4. 已知事项与处理建议

- 前端全量 Vitest 在当前环境下存在 worker 启动超时（`vitest-pool`）问题，属于测试运行环境稳定性问题，不是业务断言失败。
- 建议在 CI 中固定执行参数（如降低并发 worker 或切换池配置）并复跑全量单测，作为后续门禁项。

## 5. 版本管理与忽略规则

- 已调整 `.gitignore`：
  - 保留 `test-reports/`、`playwright-report/`、`test-results/` 等测试产物忽略。
  - 取消对 `frontend/e2e/`、`frontend/playwright.config.ts`、`tools/e2e-shopping/` 的忽略，确保测试脚本可纳入版本管理。
