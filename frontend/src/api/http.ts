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
  message: string
  data?: T
}

const http = axios.create()

http.interceptors.request.use((config) => {
  const url = String(config?.url || '')
  const isAdminApi = url.startsWith('/api/admin')
  // 管理端 API 只能携带 admin_access_token，避免普通用户 token 被误用到后台接口
  const token = isAdminApi ? localStorage.getItem('admin_access_token') : localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status
    const url = String(error?.config?.url || '')
    const msg = error?.response?.data?.message || error?.message || '请求失败'
    const isAuthApi = url.startsWith('/api/user/login') || url.startsWith('/api/user/register') || url.startsWith('/api/admin/login')
    if (status === 401) {
      if (!isAuthApi) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('admin_access_token')
        localStorage.removeItem('admin_refresh_token')
        try {
          window.dispatchEvent(new Event('auth:logout'))
        } catch {}
        notify('登录已过期，请重新登录', { tone: 'error', flash: true })
      }
    } else if (status === 403) {
      if (!isAuthApi) notify('无权限访问', { tone: 'error', flash: true })
    } else {
      if (!isAuthApi) notify(String(msg), { tone: 'error' })
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
