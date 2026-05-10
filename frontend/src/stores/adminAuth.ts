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
import http, { unwrap } from '@/api/http'

type LoginResponse = {
  tokens?: { access_token?: string; refresh_token?: string }
  user?: { username?: string; phone?: string }
  permissions?: string[]
  rbac_version?: number
}

const STORAGE_KEY_ACCESS = 'admin_access_token'
const STORAGE_KEY_REFRESH = 'admin_refresh_token'
const STORAGE_KEY_PHONE = 'admin_user_phone'
const STORAGE_KEY_NAME = 'admin_user_name'

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const userPhone = ref<string | null>(null)
  const userName = ref<string | null>(null)
  const permissions = ref<string[]>([])
  const verified = ref(false)
  const checking = ref(false)

  const isAuthed = computed(() => verified.value)

  function syncFromStorage() {
    const at = localStorage.getItem(STORAGE_KEY_ACCESS)
    const rt = localStorage.getItem(STORAGE_KEY_REFRESH)
    if (at) {
      accessToken.value = at
      refreshToken.value = rt || null
      userPhone.value = localStorage.getItem(STORAGE_KEY_PHONE) || null
      userName.value = localStorage.getItem(STORAGE_KEY_NAME) || null
    }
  }

  function persistToStorage() {
    if (accessToken.value) {
      localStorage.setItem(STORAGE_KEY_ACCESS, accessToken.value)
      localStorage.setItem(STORAGE_KEY_REFRESH, refreshToken.value || '')
      localStorage.setItem(STORAGE_KEY_PHONE, userPhone.value || '')
      localStorage.setItem(STORAGE_KEY_NAME, userName.value || '')
    }
  }

  function clearStorage() {
    localStorage.removeItem(STORAGE_KEY_ACCESS)
    localStorage.removeItem(STORAGE_KEY_REFRESH)
    localStorage.removeItem(STORAGE_KEY_PHONE)
    localStorage.removeItem(STORAGE_KEY_NAME)
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
    const resp = await http.post('/api/admin/login', { phone, password })
    const data = unwrap<LoginResponse>(resp)
    const at = data?.tokens?.access_token
    const rt = data?.tokens?.refresh_token
    if (!at) {
      throw new Error(resp?.data?.message || '登录失败')
    }
    accessToken.value = String(at)
    refreshToken.value = rt ? String(rt) : null
    userPhone.value = data?.user?.phone ? String(data.user.phone) : phone
    userName.value = data?.user?.username ? String(data.user.username) : null
    permissions.value = Array.isArray(data?.permissions) ? data.permissions.map(String) : []
    verified.value = true
    persistToStorage()
  }

  /**
   * 向后端验证当前 admin_access_token 是否为"真实管理员会话"。
   *
   * Returns:
   *   - true: token 有效且具备管理员身份（并刷新 permissions）
   *   - false: token 缺失/失效/非管理员（会清理本地后台 token）
   */
  async function verifyAdmin() {
    if (checking.value) return verified.value
    checking.value = true
    try {
      const resp = await http.get('/api/admin/me/permissions')
      const data = unwrap<{ permissions?: string[] }>(resp)
      permissions.value = Array.isArray(data?.permissions) ? data.permissions.map(String) : []
      verified.value = true
      return true
    } catch {
      logout()
      return false
    } finally {
      checking.value = false
    }
  }

  /**
   * 退出管理后台：清理本地后台 token 与相关状态。
   */
  function logout() {
    accessToken.value = null
    refreshToken.value = null
    userPhone.value = null
    userName.value = null
    permissions.value = []
    verified.value = false
    clearStorage()
  }

  async function logoutRemote() {
    try {
      await http.post('/api/admin/logout')
    } catch {}
    logout()
    try {
      window.dispatchEvent(new Event('auth:logout'))
    } catch {}
  }

  return {
    accessToken,
    refreshToken,
    userPhone,
    userName,
    permissions,
    verified,
    checking,
    isAuthed,
    syncFromStorage,
    login,
    verifyAdmin,
    logout,
    logoutRemote
  }
})
