import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/utils/notify', () => {
  return {
    notify: vi.fn()
  }
})

describe('api/http', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('request interceptor attaches csrf header on unsafe method', async () => {
    const httpMod = await import('@/api/http')
    const http = httpMod.default as any
    const reqHandler = http.interceptors.request.handlers[0].fulfilled as (c: any) => any

    Object.defineProperty(document, 'cookie', {
      value: 'csrf_access_token=csrf123',
      writable: true
    })

    const req = reqHandler({ method: 'post', url: '/api/cart/add', headers: {} })
    expect(req.headers['X-CSRF-TOKEN']).toBe('csrf123')
  })

  it('response interceptor emits logout on 401', async () => {
    const { notify } = await import('@/utils/notify')
    const httpMod = await import('@/api/http')
    const http = httpMod.default as any
    const rejHandler = http.interceptors.response.handlers[0].rejected as (e: any) => Promise<never>

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await expect(
      rejHandler({
        response: { status: 401, data: { message: 'expired' } },
        message: 'expired',
        config: { url: '/api/order/history', __retried: true }
      })
    ).rejects.toBeTruthy()

    expect(dispatchSpy).toHaveBeenCalled()
    expect((notify as any).mock.calls[0][0]).toBe('登录已过期，请重新登录')
  })

  it('response interceptor shows forbidden on 403', async () => {
    const { notify } = await import('@/utils/notify')
    const httpMod = await import('@/api/http')
    const http = httpMod.default as any
    const rejHandler = http.interceptors.response.handlers[0].rejected as (e: any) => Promise<never>

    await expect(
      rejHandler({ response: { status: 403, data: { message: 'forbidden' } }, message: 'forbidden', config: { url: '/api/order/create' } })
    ).rejects.toBeTruthy()
    expect((notify as any).mock.calls.at(-1)[0]).toBe('无权限访问')
  })

  it('unwrap returns envelope data', async () => {
    const { unwrap } = await import('@/api/http')
    const data = unwrap<{ ok: boolean }>({ data: { code: 0, message: 'ok', data: { ok: true } } })
    expect(data.ok).toBe(true)
  })
})
