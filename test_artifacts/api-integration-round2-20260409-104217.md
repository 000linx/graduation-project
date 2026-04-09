# 前后端接口对接测试（二轮）报告

- run_id: 20260409-104217
- started_at: 2026-04-09T10:42:17
- finished_at: 2026-04-09T10:43:08
- backend: http://127.0.0.1:5000
- frontend: http://127.0.0.1:5173

## 汇总
- total: 17
- passed: 17
- failed: 0

## 明细
- P-001 前端代理 /api/product/list：PASS (HTTP 200)
- A-001 管理员 bootstrap（允许重复执行时返回 409）：PASS (HTTP 409)
- A-002 管理员登录：PASS (HTTP 200)
- A-003 管理员创建商品：PASS (HTTP 201)
- U-001 用户注册（手机号）：PASS (HTTP 201)
- U-002 用户登录（手机号）：PASS (HTTP 200)
- C-001 加入购物车（库存足够）：PASS (HTTP 200)
- C-002 查看购物车：PASS (HTTP 200)
- O-001 创建订单（后端计算金额+扣库存+清购物车）：PASS (HTTP 201)
- O-002 订单列表（支持状态筛选）：PASS (HTTP 200)
- O-003 订单详情（仅本人可见）：PASS (HTTP 200)
- O-004 订单支付：PASS (HTTP 200)
- O-005 提交取消申请：PASS (HTTP 200)
- A-004 管理员更新订单状态为 delivered：PASS (HTTP 200)
- O-006 订单评价（delivered 后允许）：PASS (HTTP 200)
- O-007 售后申请：PASS (HTTP 200)
- A-005 管理员处理售后（approved）：PASS (HTTP 200)

## 产物
- 结果 JSON：test_artifacts\api-integration-round2-20260409-104217.json
- 报告 MD：test_artifacts\api-integration-round2-20260409-104217.md