import axios from 'axios'
import { notify } from '../utils/notify'

export type ApiEnvelope<T> = {
  code: number
  message: string
  data?: T
}

const http = axios.create()

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('admin_access_token')
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
    const msg = error?.response?.data?.message || error?.message || '请求失败'
    if (status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_refresh_token')
      try {
        window.dispatchEvent(new Event('auth:logout'))
      } catch {
      }
      notify('登录已过期，请重新登录', { tone: 'error', flash: true })
    } else if (status === 403) {
      notify('无权限访问', { tone: 'error', flash: true })
    } else {
      notify(String(msg), { tone: 'error' })
    }
    return Promise.reject(error)
  }
)

export function unwrap<T>(resp: { data: ApiEnvelope<T> }): T {
  return (resp?.data?.data ?? null) as T
}

export default http
