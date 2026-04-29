# 购物车数据同步缺陷修复报告

## 现象复述

- 用户点击“加入购物车”后弹出“已加入购物车/已添加成功”提示
- 购物车组件未实时刷新、购物车图标数字不更新
- localStorage/sessionStorage 与后端接口返回数据不一致

## 根因分析

1. 加购逻辑仅发起接口请求并提示成功，但没有更新任何全局购物车状态（Pinia/Vuex）或触发购物车重新拉取。
2. Header 的购物车角标为静态值（固定 `0`），不依赖响应式状态，因此无论后端是否成功加购都不会变化。
3. `Cart.vue` 页面为“空购物车占位页”，并未从后端 `/api/cart/items` 拉取购物车数据，自然不会展示最新条目。
4. 前端缺少统一的“购物车缓存策略”：localStorage 中不存在可信的购物车快照，导致 UI/缓存/接口返回之间无法对齐。

## 修复方案与实现

### 1) 引入 Pinia 购物车 Store（单一数据源）

- 新增 `useCartStore()` 作为购物车的唯一状态来源：
  - `items`：后端返回的 `product_id/quantity` 列表
  - `products`：商品信息缓存（用于列表展示）
  - `totalQty`：角标所需总数量（响应式 computed）
  - `fetchCart/addToCart/updateQty/removeItem`：统一封装与后端同步动作
  - localStorage 缓存：`cart_cache_v1`（每次同步后覆盖写入）

文件： [cart.ts](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/stores/cart.ts)

### 2) Header 角标改为响应式绑定 + 初始化拉取

- Header 挂载时调用 `cart.init()`：
  - 先从 localStorage 读取缓存以快速渲染
  - 如果存在 token，再从后端拉取一次确保与服务端一致
- 角标展示规则：`totalQty > 0` 时才展示，并显示实时数量

文件： [Header.vue](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/components/Header.vue)

### 3) 加购链路：成功提示后同步刷新 Store

- 商品卡片点击“加入购物车”后：
  - 未登录：提示并跳转登录页（保持 redirect 回跳）
  - 已登录：调用 `cart.addToCart()`，内部会 `POST /api/cart/add` 后 `fetchCart()`，确保 UI/缓存与后端一致

文件： [ProductCard.vue](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/components/ProductCard.vue)

### 4) 购物车页面改为真实数据渲染（监听 Store）

- `Cart.vue` 改为基于 `cart.items/products` 计算表格行：
  - 数量变更：`PUT /api/cart/update` 后同步刷新
  - 删除：`DELETE /api/cart/remove/<product_id>` 后同步刷新
  - 未登录：提示并不展示购物车数据

文件： [Cart.vue](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/views/Cart.vue)

## 测试用例与验证结果

### 单元测试（Vitest）

- Store 同步：`fetchCart` 更新 `items/totalQty` 且写入 localStorage
- 加购动作：`addToCart` 会调用接口并触发 `fetchCart`，最终 `totalQty` 与接口一致

文件： [cartStore.spec.ts](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/tests/cartStore.spec.ts)

结果：`npx vitest run` 全部通过（14/14）。

### 端到端测试（Playwright）

- 用例：添加商品 → 成功提示 → Header 角标变为 1 → 进入 `/cart` 展示对应商品
- 使用网络拦截模拟后端响应，避免依赖真实后端环境不稳定因素

文件： [cart-sync.spec.ts](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/tests/e2e/cart-sync.spec.ts)

结果：`npx playwright test` 全部通过（5/5）。

## 回归结论

- 加购成功后，购物车角标与购物车列表均能实时刷新
- localStorage 的 `cart_cache_v1` 与后端 `/api/cart/items` 保持一致（以服务端结果为准刷新）
- 未登录加购会提示并跳转登录页，且支持 redirect 回跳
