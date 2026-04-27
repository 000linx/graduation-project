import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/utils/notify', () => {
  return {
    notify: vi.fn(),
  }
})

describe('api/http', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('request interceptor attaches correct token by url prefix', async () => {
    const httpMod = await import('@/api/http')
    const http = httpMod.default as any
    const reqHandler = http.interceptors.request.handlers[0].fulfilled as (c: any) => any

    localStorage.setItem('access_token', 'user_t')
    localStorage.setItem('admin_access_token', 'admin_t')

    const userReq = reqHandler({ url: '/api/product/list', headers: {} })
    expect(userReq.headers.Authorization).toBe('Bearer user_t')

    const adminReq = reqHandler({ url: '/api/admin/me/permissions', headers: {} })
    expect(adminReq.headers.Authorization).toBe('Bearer admin_t')
  })

  it('response interceptor clears tokens and emits logout on 401', async () => {
    const { notify } = await import('@/utils/notify')
    const httpMod = await import('@/api/http')
    const http = httpMod.default as any
    const rejHandler = http.interceptors.response.handlers[0].rejected as (e: any) => Promise<never>

    localStorage.setItem('access_token', 't')
    localStorage.setItem('refresh_token', 'rt')
    localStorage.setItem('admin_access_token', 'at')
    localStorage.setItem('admin_refresh_token', 'art')

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await expect(
      rejHandler({ response: { status: 401, data: { message: 'expired' } }, message: 'expired' })
    ).rejects.toBeTruthy()

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('admin_access_token')).toBeNull()
    expect(dispatchSpy).toHaveBeenCalled()
    expect((notify as any).mock.calls[0][0]).toBe('登录已过期，请重新登录')
  })

  it('response interceptor shows forbidden on 403', async () => {
    const { notify } = await import('@/utils/notify')
    const httpMod = await import('@/api/http')
    const http = httpMod.default as any
    const rejHandler = http.interceptors.response.handlers[0].rejected as (e: any) => Promise<never>

    await expect(rejHandler({ response: { status: 403, data: { message: 'forbidden' } } })).rejects.toBeTruthy()
    expect((notify as any).mock.calls.at(-1)[0]).toBe('无权限访问')
  })

  it('unwrap returns envelope data', async () => {
    const { unwrap } = await import('@/api/http')
    const data = unwrap<{ ok: boolean }>({ data: { code: 0, message: 'ok', data: { ok: true } } })
    expect(data.ok).toBe(true)
  })
})
