# 助听器购物商城 - 页面设计文档 (PDD)

## 1. 整体视觉风格
- **色调**：以专业、信赖的蓝色为主色调，白色为背景，深灰色为文字颜色。
- **布局**：响应式设计，适配手机、平板、桌面端。
- **交互**：使用 Element Plus 组件，保持风格统一。

## 2. 页面设计详情

### 2.1 首页 (Home.vue)
- **Header**：Logo、搜索框、购物车入口、用户中心入口。
- **Banner**：高清助听器产品图、宣传标语。
- **Category Navigation**：按照助听器类型（入耳式、耳背式、隐形式等）分类导航。
- **Recommend List**：使用 `ProductCard` 组件展示精选产品。
- **Footer**：关于我们、联系方式、售后政策。

### 2.2 商品详情页 (ProductDetail.vue)
- **Breadcrumb**：展示层级路径。
- **Product Gallery**：左侧商品大图及缩略图轮播。
- **Product Info**：右侧标题、价格、评分、库存、配置选项（颜色、佩戴方式）。
- **Action Buttons**：加入购物车、立即购买。
- **Tabs**：商品详情介绍、用户评价、常见问题解答。

### 2.3 购物车页 (Cart.vue)
- **Table**：展示商品列表，包含复选框、商品信息、单价、数量调节、小计、操作。
- **Summary Bar**：已选商品数、总金额、结算按钮。
- **Empty State**：当购物车为空时展示提示信息及“去逛逛”按钮。

### 2.4 结算页 (Checkout.vue)
- **Step Bar**：展示结算步骤（收货人信息 -> 订单确认 -> 支付）。
- **Address Form**：收货人姓名、电话、省市区地址详情。
- **Order Summary**：展示最终确认的商品及价格明细。
- **Payment Method**：选择在线支付或货到付款。

### 2.5 个人中心 (UserCenter.vue)
- **Side Menu**：我的订单、个人资料、收货地址、我的收藏、修改密码。
- **Order List**：展示历史订单，包含状态（待付款、待发货、已完成等）。

### 2.6 管理后台 (AdminPanel.vue)
- **Sidebar**：仪表盘、商品管理、订单管理、用户管理。
- **Main Content**：对应的管理表格及操作（增删改查）。

## 3. 可复用组件设计

### 3.1 Header.vue
- 顶部固定，包含导航及搜索功能。

### 3.2 ProductCard.vue
- 展示商品图片、名称、价格。
- 鼠标悬浮时有阴影效果，点击跳转详情页。

### 3.3 SearchBar.vue
- 支持输入关键词搜索，提供联想搜索功能。

### 3.4 Pagination.vue
- 分页控制，与 Element Plus `el-pagination` 结合。
