import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue')
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/Cart.vue')
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../views/Checkout.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/recommendations',
    name: 'Recommendations',
    component: () => import('../views/Recommendations.vue')
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/profile',
    name: 'UserCenter',
    component: () => import('../views/UserCenter.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/admin/AdminDashboard.vue'),
        meta: { title: '概览' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/AdminUsers.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('../views/admin/AdminProducts.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('../views/admin/AdminOrders.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'sales',
        name: 'AdminSales',
        component: () => import('../views/admin/AdminSales.vue'),
        meta: { title: '销售报表' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const requiresAuth = Boolean(to.meta?.requiresAuth)
  const isAdmin = to.path === '/admin' || to.path.startsWith('/admin/')
  const isAdminLogin = to.path === '/admin/login'

  // Admin routes (excluding /admin/login) require authentication
  if (isAdmin && !isAdminLogin) {
    const adminToken = localStorage.getItem('admin_access_token')
    if (!adminToken) return { path: '/admin/login', query: { redirect: to.fullPath } }
    return true
  }

  if (!requiresAuth) return true
  const token = localStorage.getItem('access_token')
  if (token) return true
  return { path: '/login', query: { redirect: to.fullPath } }
})

export default router
