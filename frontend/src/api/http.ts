/**
 * HTTP 客户端封装（Axios）。
 *
 * 职责：
 * - 统一为请求附加鉴权头（区分前台/后台 token）
 * - 统一处理 401/403 等常见错误并给出用户提示
 * - 提供 unwrap 辅助函数将 ApiEnvelope 解包为业务数据
 *
 * Author: Graduation Project Team
 * Created: 2026-04-26
 * Dependencies:
 * - axios
 * - notify 工具（用于错误提示）
 */

import axios from 'axios'
import { notify } from '@/utils/notify'

/**
 * 后端统一响应包装结构。
 *
 * code/message 由后端返回；data 为具体业务数据。
 */
export type ApiEnvelope<T> = {
  code: number
  msg?: string
  message?: string
  data?: T
}

function getCookie(name: string): string | null {
  const raw = String(document?.cookie || '')
  if (!raw) return null
  const parts = raw.split(';')
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('=') || '')
  }
  return null
}

const http = axios.create({ withCredentials: true })

http.interceptors.request.use((config) => {
  const m = String(config?.method || 'get').toUpperCase()
  const unsafe = m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS'
  if (unsafe) {
    const url = String(config?.url || '')
    const isRefresh = url.startsWith('/api/user/refresh') || url.startsWith('/api/admin/refresh')
    const csrf = isRefresh ? getCookie('csrf_refresh_token') : getCookie('csrf_access_token')
    if (csrf) {
      config.headers = config.headers ?? {}
      config.headers['X-CSRF-TOKEN'] = csrf
    }
  }
  return config
})

http.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const status = error?.response?.status
    const url = String(error?.config?.url || '')
    const msg = error?.response?.data?.msg || error?.response?.data?.message || error?.message || '请求失败'

    const isAuthAction =
      url.startsWith('/api/user/login') ||
      url.startsWith('/api/user/register') ||
      url.startsWith('/api/admin/login')

    const isRefresh = url.startsWith('/api/user/refresh') || url.startsWith('/api/admin/refresh')

    const isSilentCheck = url.startsWith('/api/user/profile') || url.startsWith('/api/admin/me/permissions')

    const needsFeedback = !isAuthAction && !isRefresh && !isSilentCheck

    if (status === 401) {
      const cfg = error?.config || {}
      if (!isRefresh && !cfg.__retried) {
        cfg.__retried = true
        try {
          const refreshUrl = url.startsWith('/api/admin') ? '/api/admin/refresh' : '/api/user/refresh'
          await http.post(refreshUrl)
          return http.request(cfg)
        } catch {}
      }
      if (!isAuthAction && !isRefresh) {
        try {
          window.dispatchEvent(new Event('auth:logout'))
        } catch {}
      }
      if (needsFeedback) {
        notify('登录已过期，请重新登录', { tone: 'error', flash: true })
      }
    } else if (status === 403) {
      if (needsFeedback) notify('无权限访问', { tone: 'error', flash: true })
    } else {
      if (needsFeedback) notify(String(msg), { tone: 'error' })
    }
    return Promise.reject(error)
  }
)

export function unwrap<T>(resp: { data: ApiEnvelope<T> }): T {
  /**
   * 解包 ApiEnvelope，返回 data 字段。
   *
   * Args:
   *   resp: Axios 响应对象（形如 { data: { code, message, data } }）
   *
   * Returns:
   *   业务数据（若后端 data 缺失则返回 null 并强转为 T）
   */
  return (resp?.data?.data ?? null) as T
}

export default http
