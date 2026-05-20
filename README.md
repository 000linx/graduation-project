# 🦻 助听器购物商城 — Hearing Aid Mall

> 基于 Flask + Vue 3 的全栈助听器电商平台，涵盖商品浏览、购物车、下单支付、设备管理、保养预约、个性化推荐、后台管理（RBAC 权限体系）等完整业务链路，并深度集成了无障碍功能与国际化支持。

---

## 📋 目录

- [功能特性](#-功能特性)
- [技术栈](#-技术栈)
- [环境依赖](#-环境依赖)
- [本地部署与运行](#-本地部署与运行)
- [项目目录结构](#-项目目录结构)
- [API 接口文档](#-api-接口文档)
- [环境配置说明](#-环境配置说明)
- [版本更新日志](#-版本更新日志)
- [贡献指南](#-贡献指南)
- [开源许可证](#-开源许可证)

---

## ✨ 功能特性

### 前台（用户端）

| 模块 | 功能描述 |
|------|---------|
| 🎬 **动画封面** | Canvas 2D 粒子物理引擎品牌展示，三种交互模式 |
| 🏠 **商品浏览** | 分类筛选、关键词搜索、价格区间、排序、分页、SSE 实时商品流 |
| 🛒 **购物车** | 添加/修改/删除/清空、库存实时校验 |
| 💳 **下单支付** | 订单创建（库存扣减）、模拟支付、支付回调、状态查询 |
| 👤 **个人中心** | 订单管理、收货地址、设备绑定、保养预约、通知设置 |
| 🗑️ **账号删除** | GDPR 合规冷静期机制，定时清理调度 |
| 🔧 **设备管理** | 助听器设备绑定/解绑/查询/状态更新 |
| 📅 **保养预约** | 时段推荐、预约提交、状态流转、PDF 报告导出 |
| 🎯 **个性化推荐** | 听力档案表单、基于画像推荐、可解释理由、CTR/CVR 评估 |
| 🎉 **促销活动** | 活动列表浏览、详情查看 |
| ♿ **无障碍 (A11y)** | 高对比度/大字模式/TTS 朗读/语音输入/实时字幕/读屏播报 |
| 🌐 **国际化 (i18n)** | 中/英文双语支持 |

### 后台（管理端）

| 模块 | 功能描述 |
|------|---------|
| 📊 **仪表盘** | 用户/商品/订单/销售额概览统计 |
| 📦 **商品管理** | 创建/编辑/删除/批量创建 |
| 📋 **订单管理** | 状态变更、物流信息更新、售后处理 |
| 👥 **用户管理** | 用户列表、角色设置、RBAC 角色分配 |
| 📈 **销售分析** | 天/周/月/季/年维度聚合、分类过滤、图表导出 |
| 🔧 **保养管理** | 预约确认/拒绝/改期/完成/批量操作/PDF 导出 |
| 🎉 **活动管理** | 活动 CRUD、版本控制、发布/下架/回滚 |
| 🔐 **RBAC 权限体系** | 3 个默认角色 + 16 个细粒度权限、Redis 缓存 |
| 📝 **审计日志** | 所有管理操作记录、敏感字段脱敏 |
| 📊 **推荐评估** | CTR/加购率/CVR 聚合计算 |

---

## 🛠 技术栈

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.10+ | 运行环境 |
| Flask | 3.1.3 | Web 框架 |
| Flask-PyMongo | 2.3.0 | MongoDB 数据库驱动 |
| Flask-JWT-Extended | 4.5.3 | JWT 认证管理 |
| Flask-Cors | 6.0.0 | 跨域请求处理 |
| Redis (redis-py) | 5.0.1 | 缓存 / Token Blocklist |
| Marshmallow | 3.26.2 | 请求/响应 Schema 校验 |
| APScheduler | 3.10.4 | 定时任务调度 |
| openpyxl | 3.1.5 | Excel 报表导出 |
| reportlab | 4.2.5 | PDF 报告生成 |
| python-dotenv | 1.2.2 | 环境变量管理 |

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Vue | 3.5.13 | 前端框架 |
| TypeScript | 5.6.2 | 类型系统 |
| Vite | 6.0.5 | 构建工具 |
| Pinia | 2.3.0 | 状态管理 |
| Vue Router | 4.5.0 | SPA 路由 |
| Axios | 1.7.9 | HTTP 客户端 |
| Element Plus | 2.9.0 | UI 组件库 |
| ECharts | 5.5.1 | 数据可视化 |
| Tailwind CSS | 3.4.16 | 原子化 CSS |
| Sass | 1.87.0 | CSS 预处理器 |
| vue-i18n | 10.0.8 | 国际化 |
| Lucide Vue Next | 0.468.0 | SVG 图标 |
| @vueuse/core | 11.3.0 | Vue 组合式工具函数 |

### 数据库与中间件

| 组件 | 版本要求 |
|------|---------|
| MongoDB | 5.0+ |
| Redis | 6.0+（可选，用于缓存/blocklist，失败自动降级） |

---

## 📦 环境依赖

### 必需环境

| 依赖项 | 最低版本 | 说明 |
|--------|---------|------|
| Python | 3.10+ | 推荐 3.10 或 3.11 |
| pip | 22.0+ | Python 包管理器 |
| Node.js | 18+ | 推荐 18 LTS 或 20 LTS |
| npm | 9.0+ | Node 包管理器 |
| MongoDB | 5.0+ | 数据库服务，需提前安装并运行 |
| Redis | 6.0+ | 缓存服务（可选，不支持时可自动降级） |

### 后端 Python 依赖

```
Flask==3.1.3
Flask-PyMongo==2.3.0
Flask-JWT-Extended==4.5.3
Flask-Cors==6.0.0
python-dotenv==1.2.2
redis==5.0.1
marshmallow==3.26.2
pytest==9.0.3
pytest-cov==5.0.0
openpyxl==3.1.5
reportlab==4.2.5
APScheduler==3.10.4
```

### 前端主要依赖（详见 `frontend/package.json`）

生产依赖：`vue` `vue-router` `pinia` `axios` `element-plus` `echarts` `lucide-vue-next` `vue-i18n` `@vueuse/core`

开发依赖：`typescript` `vite` `@vitejs/plugin-vue` `sass` `tailwindcss` `vue-tsc` `prettier` `stylelint`

---

## 🚀 本地部署与运行

### 前置准备

确保以下服务已安装并运行：

```bash
# 检查 MongoDB 运行状态
mongosh --eval "db.runCommand({ ping: 1 })"

# 检查 Redis 运行状态（可选）
redis-cli ping
```

### 步骤 1：克隆项目

```bash
git clone https://github.com/000linx/graduation-project.git
cd graduation-project
```

### 步骤 2：后端配置与启动

```bash
# 进入后端目录
cd backend

# 创建虚拟环境（推荐）
python -m venv .venv
# Windows 激活：
.venv\Scripts\activate
# macOS / Linux 激活：
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量（可选，默认使用 DevelopmentConfig）
# 生产环境需设置：
#   FLASK_CONFIG=production
#   SECRET_KEY=<your-secret-key>
#   JWT_SECRET_KEY=<your-jwt-secret-key>
#   ADMIN_BOOTSTRAP_SECRET=<your-admin-secret>
#   MONGO_URI=mongodb://localhost:27017/hearing_aid_mall
#   REDIS_URL=redis://localhost:6379/0

# 启动后端服务（默认 http://127.0.0.1:5000）
cd app
python main.py
```

后端启动后将自动：
- 创建 MongoDB 索引（users / devices / maintenance_appointments / activities）
- 启动账号删除调度器（APScheduler）

### 步骤 3：前端配置与启动

```bash
# 新开一个终端，进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev
```

前端开发服务器已配置 API 代理，`/api` 请求将自动转发至 `http://127.0.0.1:5000`。

### 步骤 4：创建管理员账号（首次使用）

```bash
# 设置环境变量为你的管理员引导密钥
# 方式一：直接在终端设置
$env:ADMIN_BOOTSTRAP_SECRET="your-secure-bootstrap-key"  # Windows PowerShell
export ADMIN_BOOTSTRAP_SECRET="your-secure-bootstrap-key" # macOS / Linux

# 方式二：使用提供的脚本创建超级管理员
cd backend
python scripts/create_super_admin_suadmin.py

# 方式三：调用 API 初始化
curl -X POST http://127.0.0.1:5000/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-secure-bootstrap-key", "username": "admin", "password": "your-admin-password"}'
```

### 步骤 5：访问系统

| 地址 | 说明 |
|------|------|
| http://localhost:5173 | 前端开发服务器（用户端） |
| http://localhost:5173/admin | 后台管理入口 |
| http://127.0.0.1:5000 | 后端 API 服务 |

### 生产构建

```bash
# 前端构建
cd frontend
npm run build
# 构建产物输出至 frontend/dist/

# 生产模式启动后端（自动托管前端静态资源）
cd backend/app
$env:FLASK_CONFIG="production"
python main.py
# 访问 http://127.0.0.1:5000 即可使用完整应用
```

---

## 📁 项目目录结构

```
graduation-project/
│
├── backend/                          # 后端 (Flask)
│   ├── app/
│   │   ├── __init__.py               # 应用工厂 create_app()
│   │   ├── main.py                   # 启动入口 (127.0.0.1:5000)
│   │   ├── config.py                 # 环境配置 (Development/Production)
│   │   ├── extensions.py             # Flask 扩展初始化
│   │   │
│   │   ├── models/                   # 数据模型层
│   │   │   ├── user_model.py         # 用户模型
│   │   │   ├── product_model.py      # 商品模型
│   │   │   ├── cart_model.py         # 购物车模型
│   │   │   ├── order_model.py        # 订单模型
│   │   │   ├── device_model.py       # 设备模型
│   │   │   ├── maintenance_model.py  # 保养预约模型
│   │   │   └── activity_model.py     # 活动模型
│   │   │
│   │   ├── routes/                   # API 路由层 (10 个蓝图)
│   │   │   ├── user.py               # 用户认证/个人中心
│   │   │   ├── product.py            # 商品浏览/搜索/推荐
│   │   │   ├── cart.py               # 购物车
│   │   │   ├── order.py              # 订单管理
│   │   │   ├── payment.py            # 支付模块
│   │   │   ├── search.py             # 全文搜索
│   │   │   ├── device.py             # 设备管理
│   │   │   ├── maintenance.py        # 保养预约
│   │   │   ├── activity.py           # 促销活动
│   │   │   └── admin.py              # 管理后台入口
│   │   │
│   │   ├── admin_v2/                 # 后台管理 V2 模块
│   │   │   ├── blueprint.py          # 蓝图注册
│   │   │   ├── controllers.py        # 用户/商品/订单/统计/RBAC 控制器
│   │   │   ├── activity_controllers.py # 活动管理控制器
│   │   │   ├── schemas.py            # Marshmallow Schema
│   │   │   ├── daos/                 # 数据访问层 (5 个 DAO)
│   │   │   │   ├── user_dao.py
│   │   │   │   ├── product_dao.py
│   │   │   │   ├── order_dao.py
│   │   │   │   ├── rbac_dao.py
│   │   │   │   └── audit_dao.py
│   │   │   └── services/             # 业务服务层 (6 个 Service)
│   │   │       ├── auth_service.py       # JWT + role 校验
│   │   │       ├── admin_service.py      # 概览统计
│   │   │       ├── sales_service.py      # 销售分析
│   │   │       ├── rbac_service.py       # RBAC 核心
│   │   │       ├── audit_service.py      # 审计日志
│   │   │       └── reco_metrics_service.py # 推荐评估
│   │   │
│   │   ├── services/                 # 业务服务层
│   │   │   ├── recommender.py        # 个性化推荐引擎
│   │   │   ├── payment_service.py    # 支付处理
│   │   │   ├── activity_service.py   # 活动管理
│   │   │   ├── maintenance_service.py # 保养预约
│   │   │   ├── maintenance_pdf_service.py # PDF 报告生成
│   │   │   ├── product_stream_service.py # SSE 商品流
│   │   │   ├── reco_event_service.py # 推荐事件追踪
│   │   │   ├── hearing_eval.py       # 听力评估
│   │   │   └── deletion_scheduler.py # 账号删除调度器
│   │   │
│   │   └── utils/                    # 工具层
│   │       ├── jwt_util.py           # JWT 工具
│   │       ├── errors.py             # 全局错误处理
│   │       ├── response.py           # 统一响应格式
│   │       ├── cache.py              # Redis 缓存
│   │       ├── mail_util.py          # 邮件工具
│   │       ├── verify_code_store.py  # 验证码存储
│   │       ├── serialize.py          # 序列化工具
│   │       ├── distributed_lock.py   # 分布式锁
│   │       └── log_util.py           # 日志工具
│   │
│   ├── scripts/                      # 脚本工具
│   │   ├── create_super_admin_suadmin.py
│   │   ├── create_test_admin_accounts.py
│   │   └── seed_four_products.py
│   │
│   ├── static/products/              # 商品图片静态资源
│   ├── requirements.txt              # Python 依赖清单
│   ├── .coveragerc                   # 测试覆盖率配置
│   └── docs/                         # 后端文档
│       ├── activity_api.md
│       ├── admin_api.md
│       ├── deployment.md
│       └── maintenance_api.md
│
├── frontend/                         # 前端 (Vue 3 + TypeScript)
│   ├── src/
│   │   ├── main.ts                   # 应用入口
│   │   ├── App.vue                   # 根组件
│   │   ├── style.css                 # 全局样式 + Tailwind
│   │   │
│   │   ├── views/                    # 页面组件
│   │   │   ├── Cover.vue             # 动画封面
│   │   │   ├── Home.vue              # 首页
│   │   │   ├── Login.vue             # 用户登录
│   │   │   ├── Register.vue          # 用户注册
│   │   │   ├── ProductDetail.vue     # 商品详情
│   │   │   ├── Cart.vue              # 购物车
│   │   │   ├── Checkout.vue          # 结算
│   │   │   ├── UserCenter.vue        # 个人中心
│   │   │   ├── Recommendations.vue   # 个性化推荐
│   │   │   ├── DeviceDetail.vue      # 设备详情
│   │   │   ├── Activities.vue        # 活动列表
│   │   │   ├── ActivityDetail.vue    # 活动详情
│   │   │   └── admin/                # 后台页面 (10 个)
│   │   │
│   │   ├── stores/                   # Pinia 状态管理 (11 个 store)
│   │   │   ├── userAuth.ts           # 用户认证状态
│   │   │   ├── adminAuth.ts          # 管理员认证状态
│   │   │   ├── cart.ts               # 购物车状态
│   │   │   ├── device.ts             # 设备状态
│   │   │   ├── reco.ts               # 推荐状态
│   │   │   ├── a11y.ts               # 无障碍状态
│   │   │   ├── speech.ts             # 语音识别状态
│   │   │   ├── cover.ts              # 封面动画状态
│   │   │   ├── toast.ts              # 通知提示状态
│   │   │   ├── announcer.ts          # 读屏播报状态
│   │   │   └── transition.ts         # 页面过渡状态
│   │   │
│   │   ├── components/               # 公共组件 (30+)
│   │   │   ├── Header.vue            # 页头导航
│   │   │   ├── ProductCard.vue       # 商品卡片
│   │   │   ├── SearchBar.vue         # 搜索栏
│   │   │   ├── Pagination.vue        # 分页组件
│   │   │   ├── ToastHost.vue         # 通知容器
│   │   │   ├── DeviceCard.vue        # 设备卡片
│   │   │   ├── BindDeviceDialog.vue  # 设备绑定弹窗
│   │   │   ├── AccountDeletion.vue   # 账号删除
│   │   │   ├── a11y/                 # 无障碍组件 (4 个)
│   │   │   ├── auth/                 # 认证组件 (3 个)
│   │   │   ├── home/                 # 首页组件 (5 个)
│   │   │   ├── reco/                 # 推荐组件
│   │   │   ├── cover/                # 封面组件
│   │   │   ├── admin/                # 后台组件
│   │   │   └── icons/                # 图标组件
│   │   │
│   │   ├── router/index.ts           # 路由配置 (25+ 路由)
│   │   ├── api/http.ts               # Axios 封装
│   │   ├── hooks/                    # 自定义 Hooks
│   │   ├── utils/                    # 工具函数 (7 个)
│   │   ├── i18n/                     # 国际化 (中/英)
│   │   ├── styles/                   # SCSS 样式
│   │   └── directives/               # 全局指令
│   │
│   ├── package.json                  # 前端依赖与脚本
│   ├── vite.config.ts                # Vite 构建配置
│   ├── tsconfig.json                 # TypeScript 配置
│   └── tools/compress-dist.mjs       # 构建后压缩
│
├── docs/                             # 项目文档
│   ├── 项目核心功能文件清单.md
│   └── 项目说明文档.docx
│
├── .gitignore                        # Git 忽略规则
└── README.md                         # 本文件
```

---

## 📡 API 接口文档

### 基础信息

| 项目 | 说明 |
|------|------|
| 基础路径 | `http://127.0.0.1:5000` |
| 认证方式 | JWT (access_token + refresh_token) |
| 请求格式 | `application/json` |
| 响应格式 | `{ "code": 200, "message": "success", "data": {...} }` |
| Token 位置 | Cookie (`access_token_cookie`) 或 Header (`Authorization: Bearer <token>`) |

### 前台 API（用户端）

#### 用户认证 `/api/user`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/user/send_verify_code` | 无 | 发送邮箱验证码 |
| `POST` | `/api/user/register` | 无 | 用户注册 |
| `POST` | `/api/user/login` | 无 | 用户登录，返回双 token |
| `POST` | `/api/user/refresh` | Refresh Token | 刷新 access_token |
| `GET` | `/api/user/profile` | JWT | 获取个人信息 |
| `POST` | `/api/user/logout` | 可选 | 登出（token 加入 blocklist） |
| `POST` | `/api/user/change_password` | JWT | 修改密码 |
| `DELETE` | `/api/user/account` | JWT | 申请账号删除（冷静期） |

#### 收货地址 `/api/user`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/user/addresses` | JWT | 地址列表 |
| `POST` | `/api/user/addresses` | JWT | 新增地址 |
| `PUT` | `/api/user/addresses/<id>` | JWT | 修改地址 |
| `DELETE` | `/api/user/addresses/<id>` | JWT | 删除地址 |

#### 商品 `/api/product`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/product/list` | 无 | 商品列表（分类/价格/排序/分页） |
| `GET` | `/api/product/<id>` | 无 | 商品详情 |
| `GET` | `/api/product/recommend` | 可选 | 推荐商品（支持听力等级过滤） |
| `GET` | `/api/product/stream` | 无 | SSE 实时商品流 |

#### 购物车 `/api/cart`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/cart/add` | JWT | 添加商品到购物车 |
| `GET` | `/api/cart/list` | JWT | 购物车列表 |
| `PUT` | `/api/cart/<item_id>` | JWT | 修改数量 |
| `DELETE` | `/api/cart/<item_id>` | JWT | 删除单项 |
| `DELETE` | `/api/cart/clear` | JWT | 清空购物车 |

#### 订单 `/api/order`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/order/create` | JWT | 创建订单（库存扣减） |
| `GET` | `/api/order/list` | JWT | 订单列表 |
| `GET` | `/api/order/<id>` | JWT | 订单详情 |
| `PUT` | `/api/order/<id>/cancel` | JWT | 取消订单 |
| `PUT` | `/api/order/<id>/receive` | JWT | 确认收货 |

#### 支付 `/api/payment`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/payment/checkout` | JWT | 发起支付 |
| `POST` | `/api/payment/callback` | 无 | 支付回调 |
| `GET` | `/api/payment/status/<order_id>` | JWT | 支付状态查询 |

#### 搜索 `/api/search`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/search/query?q=关键词` | 无 | 全文搜索商品 |

#### 设备管理 `/api/user/devices`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/user/devices` | JWT | 设备列表 |
| `POST` | `/api/user/devices` | JWT | 绑定设备 |
| `PUT` | `/api/user/devices/<id>` | JWT | 更新设备 |
| `DELETE` | `/api/user/devices/<id>` | JWT | 解绑设备 |

#### 保养预约 `/api/maintenance`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/maintenance/eligible` | JWT | 可保养订单列表 |
| `GET` | `/api/maintenance/slots` | 可选 | 推荐预约时段 |
| `POST` | `/api/maintenance/appointments` | JWT | 创建预约 |
| `GET` | `/api/maintenance/appointments` | JWT | 预约列表 |
| `GET` | `/api/maintenance/appointments/<id>` | JWT | 预约详情 |

#### 活动 `/api/activity`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/activity/list` | 无 | 活动列表 |
| `GET` | `/api/activity/<id>` | 无 | 活动详情 |

### 后台 API（管理端）

所有后台接口均需 JWT + `role=admin`，大部分接口有细粒度 RBAC 权限控制。

#### 管理员认证 `/api/admin`

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/admin/bootstrap` | Bootstrap Secret | 首次创建管理员 |
| `POST` | `/api/admin/login` | 无 | 管理员登录 |
| `POST` | `/api/admin/refresh` | Refresh Token | Token 刷新 |
| `POST` | `/api/admin/logout` | 无 | 管理员登出 |
| `GET` | `/api/admin/me/permissions` | Admin JWT | 当前权限列表 |

#### 统计数据 `/api/admin`

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| `GET` | `/api/admin/stats` | `admin.stats.read` | 概览统计 |
| `GET` | `/api/admin/sales/series` | `admin.stats.read` | 销售时序数据 |
| `GET` | `/api/admin/sales/detail` | `admin.stats.read` | 销售明细 |
| `GET` | `/api/admin/reco/metrics` | `admin.stats.read` | 推荐效果指标 |

#### 用户管理 `/api/admin`

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| `GET` | `/api/admin/users` | `admin.users.read` | 用户列表 |
| `PUT` | `/api/admin/users/<id>/role` | `admin.users.set_role` | 设置用户角色 |
| `PUT` | `/api/admin/users/<id>/rbac_roles` | `admin.users.set_rbac_roles` | 设置 RBAC 角色 |

#### 商品管理 `/api/admin`

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| `POST` | `/api/admin/products` | `admin.products.create` | 创建商品 |
| `POST` | `/api/admin/products/batch` | `admin.products.create` | 批量创建 |
| `PUT` | `/api/admin/products/<id>` | `admin.products.update` | 更新商品 |
| `DELETE` | `/api/admin/products/<id>` | `admin.products.delete` | 删除商品 |

#### 订单管理 `/api/admin`

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| `GET` | `/api/admin/orders` | `admin.orders.read` | 订单列表 |
| `PUT` | `/api/admin/orders/<id>/status` | `admin.orders.update_status` | 更新订单状态 |
| `PUT` | `/api/admin/orders/<id>/shipping` | `admin.orders.update_status` | 更新物流 |
| `PUT` | `/api/admin/orders/<id>/after_sale` | `admin.orders.process_after_sale` | 处理售后 |

#### 保养管理 `/api/admin/maintenance`

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| `GET` | `/api/admin/maintenance/appointments` | `admin.maintenance.read` | 预约列表 |
| `GET` | `/api/admin/maintenance/appointments/<id>` | `admin.maintenance.read` | 预约详情 |
| `POST` | `/api/admin/maintenance/appointments/<id>/confirm` | `admin.maintenance.manage` | 确认预约 |
| `POST` | `/api/admin/maintenance/appointments/<id>/reject` | `admin.maintenance.manage` | 拒绝预约 |
| `POST` | `/api/admin/maintenance/appointments/<id>/reschedule` | `admin.maintenance.manage` | 改期 |
| `POST` | `/api/admin/maintenance/appointments/<id>/complete` | `admin.maintenance.manage` | 完成保养 |
| `GET` | `/api/admin/maintenance/records/<id>/pdf` | `admin.maintenance.manage` | 导出 PDF |

#### 活动管理 `/api/admin`

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| `GET` | `/api/admin/activities` | `admin.activities.read` | 活动列表 |
| `POST` | `/api/admin/activities` | `admin.activities.manage` | 创建活动草稿 |
| `PUT` | `/api/admin/activities/<id>` | `admin.activities.manage` | 保存活动 |
| `POST` | `/api/admin/activities/<id>/publish` | `admin.activities.manage` | 发布活动 |
| `POST` | `/api/admin/activities/<id>/offline` | `admin.activities.manage` | 下架活动 |
| `GET` | `/api/admin/activities/<id>/versions` | `admin.activities.read` | 版本历史 |
| `POST` | `/api/admin/activities/<id>/rollback` | `admin.activities.manage` | 版本回滚 |

#### RBAC 管理 `/api/admin/rbac`

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| `GET` | `/api/admin/rbac/permissions` | `admin.rbac.manage` | 权限列表 |
| `GET` | `/api/admin/rbac/roles` | `admin.rbac.manage` | 角色列表 |
| `POST` | `/api/admin/rbac/roles` | `admin.rbac.manage` | 创建角色 |
| `PUT` | `/api/admin/rbac/roles/<id>` | `admin.rbac.manage` | 更新角色 |
| `DELETE` | `/api/admin/rbac/roles/<id>` | `admin.rbac.manage` | 删除角色 |

#### 审计日志 `/api/admin`

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| `GET` | `/api/admin/audit` | `admin.audit.read` | 审计日志查询 |

---

## ⚙️ 环境配置说明

### 后端配置（`backend/app/config.py`）

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `FLASK_CONFIG` | `default` | 配置环境：`default` / `development` / `production` |
| `SECRET_KEY` | 内置开发密钥 | Flask 应用密钥（**生产环境必须修改**） |
| `MONGO_URI` | `mongodb://localhost:27017/hearing_aid_mall` | MongoDB 连接串 |
| `JWT_SECRET_KEY` | 内置开发密钥 | JWT 签名密钥（**生产环境必须修改**） |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis 连接 URL（可选） |
| `ADMIN_BOOTSTRAP_SECRET` | 环境变量 | 管理员首次创建密钥（**生产环境必须设置**） |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | 允许的跨域来源 |

### JWT 配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `JWT_ACCESS_TOKEN_EXPIRES` | 15 分钟 | 短期 access_token |
| `JWT_REFRESH_TOKEN_EXPIRES` | 7 天 | 长期 refresh_token |
| Token 存储方式 | Cookie + Header | 双通道支持 |

### 生产环境安全建议

```bash
# 生产环境必须设置以下环境变量
export FLASK_CONFIG=production
export SECRET_KEY="<random-50-char-string>"
export JWT_SECRET_KEY="<random-50-char-string>"
export ADMIN_BOOTSTRAP_SECRET="<random-32-char-string>"
export MONGO_URI="mongodb://<user>:<password>@<host>:<port>/hearing_aid_mall"
export REDIS_URL="redis://:<password>@<host>:<port>/0"
```

---

## 📝 版本更新日志

### v1.0.0（2026-05-11）— 毕业设计交付版

**核心功能**
- ✨ 实现完整的助听器电商前后台系统
- 🎬 Canvas 2D 粒子物理引擎动画封面
- 🛒 商品浏览、购物车、下单支付完整链路
- 📅 保养预约系统（时段推荐、状态流转、PDF报告）
- 🎯 基于听力画像的个性化推荐引擎
- 🎉 促销活动管理（草稿/发布/下架/版本回滚）
- 📊 管理后台仪表盘与销售分析（ECharts可视化）
- 🔐 RBAC 权限体系（3角色16权限+审计日志）
- ♿ 深度无障碍功能（高对比度/大字/TTS/语音输入/字幕/播报）
- 🌐 中英文国际化支持
- 📡 SSE 实时商品流
- 🔒 JWT 双 Token + CSRF 保护 + Redis Blocklist

**架构优化**
- 🏗️ 后端分层架构（Routes → Controllers → Services → DAOs → Models）
- 🏭 Flask 应用工厂模式，支持多环境配置
- 📦 前后端一体化部署（Flask 托管 Vue SPA）

**系统清理**
- 🧹 移除约 21,000 个冗余文件（构建产物、虚拟环境、测试产物等）
- 🗑️ 移除 47 个测试文件（已备份归档）

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下流程：

### 分支规范

| 分支类型 | 命名格式 | 说明 |
|---------|---------|------|
| 主分支 | `main` | 稳定发布版本 |
| 功能分支 | `feat/<功能描述>` | 新功能开发 |
| 修复分支 | `fix/<问题描述>` | Bug 修复 |
| 清理分支 | `cleanup/<清理内容>` | 代码清理/重构 |

### 提交规范

本项目遵循 [约定式提交（Conventional Commits）](https://www.conventionalcommits.org/zh-hans/) 规范：

```
<type>: <简短描述>

<详细说明（可选）>

<关联 issue（可选）>
```

**Type 类型说明：**

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖 |
| `cleanup` | 代码清理 |

### Pull Request 流程

1. **Fork** 本仓库
2. 从 `main` 分支创建功能分支：`git checkout -b feat/your-feature`
3. 开发并提交代码（遵循提交规范）
4. 确保代码通过代码检查（`npm run lint:css`、`npm run format:check`）
5. 将分支推送到远程：`git push origin feat/your-feature`
6. 在 GitHub 上创建 [Pull Request](https://github.com/000linx/graduation-project/compare)，描述变更内容
7. 等待代码审查，根据反馈修改

### Issue 提交规范

提交 Issue 时请包含以下信息：
- **问题描述**：清晰描述遇到的问题或期望的功能
- **复现步骤**（Bug）：详细的操作步骤
- **期望行为 vs 实际行为**
- **环境信息**：操作系统、Python/Node 版本、浏览器版本
- **截图/日志**（如有）：附加相关截图或错误日志

---

## 📄 开源许可证

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源。

```
MIT License

Copyright (c) 2026 助听器购物商城项目组

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**Made with ❤️ by Graduation Project Team**

[🔝 返回顶部](#-助听器购物商城--hearing-aid-mall)

</div>
