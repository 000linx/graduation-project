/**
 * 管理员鉴权状态（Pinia Store）。
 *
 * 职责：
 * - 管理后台登录态（admin_access_token/admin_refresh_token）
 * - 保存权限列表（RBAC permissions）与“已验真”状态
 * - 提供 verifyAdmin 用于路由守卫/页面初始化时向后端确认管理员身份
 *
 * Author: Graduation Project Team
 * Created: 2026-04-26
 * Dependencies:
 * - /api/admin/login
 * - /api/admin/me/permissions
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'
import http, { unwrap } from '@/api/http'

type LoginResponse = {
  tokens?: { access_token?: string; refresh_token?: string }
  user?: { username?: string; phone?: string }
  permissions?: string[]
  rbac_version?: number
}

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('admin_access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('admin_refresh_token'))
  const userPhone = ref<string | null>(null)
  const userName = ref<string | null>(null)
  const permissions = ref<string[]>([])
  const verified = ref(false)

  const isAuthed = computed(() => Boolean(accessToken.value))

  /**
   * 从 localStorage 同步 token 到响应式状态。
   *
   * Notes:
   * - 该函数不会进行后端验真，仅用于刷新内存态。
   */
  function syncFromStorage() {
    accessToken.value = localStorage.getItem('admin_access_token')
    refreshToken.value = localStorage.getItem('admin_refresh_token')
  }

  /**
   * 管理员登录。
   *
   * Args:
   *   phone: 管理员手机号
   *   password: 密码
   *
   * Throws:
   *   Error: 当后端返回异常或响应不包含 access_token 时抛出
   */
  async function login(phone: string, password: string) {
    const resp = await axios.post('/api/admin/login', { phone, password })
    const data = (resp?.data?.data ?? {}) as LoginResponse
    const at = data?.tokens?.access_token
    const rt = data?.tokens?.refresh_token
    if (!at) {
      throw new Error(resp?.data?.message || '登录失败')
    }
    localStorage.setItem('admin_access_token', String(at))
    if (rt) localStorage.setItem('admin_refresh_token', String(rt))
    accessToken.value = String(at)
    refreshToken.value = rt ? String(rt) : null
    userPhone.value = data?.user?.phone ? String(data.user.phone) : phone
    userName.value = data?.user?.username ? String(data.user.username) : null
    permissions.value = Array.isArray(data?.permissions) ? data.permissions.map(String) : []
    verified.value = true
  }

  /**
   * 向后端验证当前 admin_access_token 是否为“真实管理员会话”。
   *
   * Returns:
   *   - true: token 有效且具备管理员身份（并刷新 permissions）
   *   - false: token 缺失/失效/非管理员（会清理本地后台 token）
   */
  async function verifyAdmin() {
    syncFromStorage()
    if (!accessToken.value) {
      verified.value = false
      permissions.value = []
      return false
    }
    try {
      const resp = await http.get('/api/admin/me/permissions')
      const data = unwrap<{ permissions?: string[] }>(resp)
      permissions.value = Array.isArray(data?.permissions) ? data.permissions.map(String) : []
      verified.value = true
      return true
    } catch {
      logout()
      return false
    }
  }

  /**
   * 退出管理后台：清理本地后台 token 与相关状态。
   */
  function logout() {
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    accessToken.value = null
    refreshToken.value = null
    userPhone.value = null
    userName.value = null
    permissions.value = []
    verified.value = false
  }

  return {
    accessToken,
    refreshToken,
    userPhone,
    userName,
    permissions,
    verified,
    isAuthed,
    syncFromStorage,
    login,
    verifyAdmin,
    logout
  }
})
