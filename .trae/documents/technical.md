# 助听器购物商城 - 技术架构文档 (TAD)

## 1. 技术栈
- **前端框架**：Vue 3
- **构建工具**：Vite
- **UI 组件库**：Element Plus (Vue 3 版本的 Element UI)
- **状态管理**：Pinia (替代 Vuex，Vue 3 推荐)
- **路由**：Vue Router 4
- **网络请求**：Axios
- **后端框架**：Flask (Python)
- **数据库**：MySQL / SQLite (视具体实现而定)

## 2. 前端项目目录结构
根据用户提供的结构：
```text
frontend/
│
├── src/
│   ├── api/                     # 封装 Axios 请求
│   │   ├── user.js              # 用户相关接口
│   │   ├── product.js           # 商品相关接口
│   │   ├── order.js             # 订单相关接口
│   │   ├── cart.js              # 购物车相关接口
│   │   └── auth.js              # 认证相关接口
│   │
│   ├── components/              # 可复用组件库
│   │   ├── ProductCard.vue      # 商品卡片组件
│   │   ├── SearchBar.vue        # 搜索栏组件
│   │   ├── Pagination.vue       # 分页组件
│   │   └── Header.vue           # 顶部导航组件
│   │
│   ├── views/                   # 页面
│   │   ├── Home.vue             # 首页
│   │   ├── ProductDetail.vue    # 商品详情页
│   │   ├── Cart.vue             # 购物车页
│   │   ├── Checkout.vue         # 结算页
│   │   ├── UserCenter.vue       # 个人中心页
│   │   └── AdminPanel.vue       # 管理后台页
│   │
│   ├── store/                   # Pinia 状态管理
│   ├── router/                  # Vue Router 路由配置
│   ├── utils/                   # 工具函数（校验、格式化、缓存等）
│   └── main.js                  # 入口文件
│
├── public/                      # 静态资源
└── vite.config.js               # Vite 配置文件
```

## 3. 路由设计
- `/` : 首页
- `/product/:id` : 商品详情页
- `/cart` : 购物车
- `/checkout` : 结算中心
- `/profile` : 个人中心
- `/admin` : 管理后台

## 4. 接口设计原则
- **RESTful API**：统一接口风格。
- **JSON 数据格式**：前后端交互统一使用 JSON。
- **Token 认证**：使用 JWT 进行身份校验。

## 5. 开发规范
- **组件化**：复用度高的 UI 提取为 `components`。
- **命名规范**：组件使用 PascalCase，普通文件使用 camelCase。
- **代码检查**：使用 ESLint 和 Prettier。
