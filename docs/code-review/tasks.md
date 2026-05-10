# 优先级优化任务清单（含验收标准）

## P0（必须）安全基线

1) Token 存储与会话安全加固
- 问题：前端大量使用 localStorage 保存 access/refresh token（XSS 风险放大）
- 建议：迁移 refresh_token 到 HttpOnly Cookie；引入 refresh 轮换与吊销；access_token 缩短 TTL；关键操作二次校验
- 验收标准：
  - 登录/刷新/登出/权限校验全链路回归通过
  - 无敏感 token 以可被 JS 读取的方式长期保存（至少 refresh_token 必须 HttpOnly）

2) 公共写入口限流与输入约束
- 问题：推荐事件上报等公共接口存在被滥用/刷写风险
- 建议：按 IP/user_id 的限流；body 大小限制；字段白名单；记录异常峰值
- 验收标准：
  - 触发阈值时返回 429 且不写库
  - 大 body/非法字段返回 400（含字段级错误信息）

3) 生产配置硬门禁
- 问题：开发模式启动时会输出 debug PIN；生产必须严格禁用 debug 并强制 secrets
- 建议：在启动入口增加环境校验（已部分存在）；部署文档明确生产配置清单
- 验收标准：
  - 生产环境启动时 debug=false；缺失 SECRET/JWT_SECRET 时拒绝启动

## P1（高收益）性能/稳定性

4) 购物车 N+1 消除
- 问题：前端对每个商品单独请求详情，导致 N+1
- 建议：新增后端批量接口或让 cart 接口直接返回商品快照；前端 store 改为单次请求
- 验收标准：
  - 购物车页面网络请求数减少 ≥80%（相同购物车规模下）
  - 基准测试脚本的 p95 至少提升 20%（以购物车相关用例为主，可用 CASES 过滤）

5) 商品搜索从 regex 迁移到 text index/可索引方案
- 问题：$regex + i 难以利用索引，数据量增长后性能会退化
- 建议：Mongo text index 或前缀索引；列表统一分页与 projection；热点查询可加短缓存
- 验收标准：
  - 典型搜索（q 不同、分页翻页）p95 降低 ≥20%
  - 索引创建脚本可重复执行且无副作用

6) SSE 长连接的生产化
- 问题：同步 worker 上 SSE 会占用并发资源
- 建议：生产运行在支持并发的 worker；客户端节流；限制连接数与推送频率
- 验收标准：
  - 20+ 并发 SSE 连接下，核心 API p95 不显著劣化（定义阈值）

## P2（中期）可维护性/扩展性

7) admin_v2 controllers 拆分与路由注册重构
- 问题：register_admin_routes 超大函数，修改风险高
- 建议：按资源域拆 controllers；每个文件只负责自身 routes
- 验收标准：
  - 功能回归通过；单测覆盖率不下降
  - 新增接口不需要改动“巨型注册函数”

8) 统一前端网络层（全部走 http.ts）
- 问题：部分页面绕过拦截器，导致错误处理/超时/鉴权策略不一致
- 建议：封装所有请求到 http.ts；补齐 timeout/abort/去重；统一错误提示
- 验收标准：
  - 全站关键路径不再直接 import axios
  - 失败提示与 401/403 行为一致

## 统一验收标准（适用于所有任务）

- 单元测试覆盖率：≥80%
  - 后端：pytest-cov（建议对 app 包统计）
  - 前端：vitest coverage
- 性能提升：≥20%
  - 使用 [run_api_bench.mjs](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/tools/bench/run_api_bench.mjs) 生成 before/after bench.json
  - 用 [compare_bench.mjs](file:///e:/毕设1/基于Flask的助听器购物商城设计与实现/tools/bench/compare_bench.mjs) 对比 p95/p99
- 质量门禁：无新增 SonarQube Blocker 级问题
  - 建议补齐 Sonar 配置并在 CI 中跑（本仓库当前未集成）

