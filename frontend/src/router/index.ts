/**
 * 前端路由配置与访问控制（Vue Router）。
 *
 * 职责：
 * - 定义前台与管理后台路由
 * - 统一处理鉴权/授权跳转（前台登录、后台管理员验证）
 *
 * Author: Graduation Project Team
 * Created: 2026-04-26
 * Dependencies:
 * - vue-router@4
 * - pinia store: adminAuth（用于后台 token 与权限校验）
 */

import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import { useAdminAuthStore } from '@/stores/adminAuth'
import Cover from '@/views/Cover.vue'
import { markCoverSeen, shouldRedirectHomeToCover } from '@/utils/coverEntry'

/**
 * 应用路由表。
 *
 * Notes:
 * - 前台受 meta.requiresAuth 控制（例如结算与个人中心）
 * - 后台统一挂载在 /admin 下，细粒度权限由页面内的权限列表与后端接口共同约束
 */
const routes = [
  {
    path: '/cover',
    name: 'Cover',
    component: Cover
  },
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
    path: '/admin/forbidden',
    name: 'AdminForbidden',
    component: () => import('../views/admin/AdminForbidden.vue')
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
      },
      {
        path: 'audit',
        name: 'AdminAudit',
        component: () => import('../views/admin/AdminAudit.vue'),
        meta: { title: '审计日志' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, top: 96 }
    }
    return { top: 0 }
  }
})

router.beforeEach(async (to) => {
  /**
   * 路由守卫：实现前台与后台的双重保护。
   *
   * - 前台：依赖 access_token（普通用户登录）
   * - 后台：依赖 admin_access_token + 后端 /api/admin/me/permissions 验真
   *
   * 返回对象表示重定向；返回 true 允许继续导航。
   */
  const requiresAuth = Boolean(to.meta?.requiresAuth)
  const isAdmin = to.path === '/admin' || to.path.startsWith('/admin/')
  const isAdminLogin = to.path === '/admin/login'
  const isAdminForbidden = to.path === '/admin/forbidden'

  // Admin routes (excluding /admin/login) require authentication
  if (isAdmin && !isAdminLogin && !isAdminForbidden) {
    const auth = useAdminAuthStore()
    auth.syncFromStorage()
    if (!auth.accessToken) return { path: '/admin/login', query: { redirect: to.fullPath } }
    if (!auth.verified) {
      const ok = await auth.verifyAdmin()
      if (!ok) return { path: '/admin/forbidden' }
    }
    return true
  }

  if (shouldRedirectHomeToCover(to.path)) {
    markCoverSeen()
    return { path: '/cover', query: { redirect: to.fullPath } }
  }

  if (!requiresAuth) return true
  const token = localStorage.getItem('access_token')
  if (token) return true
  return { path: '/login', query: { redirect: to.fullPath } }
})

export default router
