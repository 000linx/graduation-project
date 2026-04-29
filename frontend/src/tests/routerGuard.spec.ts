import { beforeEach, describe, expect, it, vi } from 'vitest'

type Guard = (to: any) => any

let guards: Guard[] = []

vi.mock('vue-router', () => {
  return {
    createWebHistory: vi.fn(() => ({})),
    createRouter: vi.fn((opts: any) => {
      guards = []
      return {
        options: opts,
        beforeEach: (fn: Guard) => guards.push(fn)
      }
    })
  }
})

vi.mock('@/stores/adminAuth', () => {
  return {
    useAdminAuthStore: vi.fn(() => ({
      accessToken: null,
      verified: false,
      syncFromStorage: vi.fn(),
      verifyAdmin: vi.fn()
    }))
  }
})

describe('router guard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('allows public routes', async () => {
    await import('@/router')
    const g = guards[0]
    const res = await g({ path: '/', meta: {}, fullPath: '/' })
    expect(res).toEqual({ path: '/cover', query: { redirect: '/' } })
  })

  it('redirects user routes requiring auth when missing token', async () => {
    await import('@/router')
    const g = guards[0]
    const res = await g({ path: '/checkout', meta: { requiresAuth: true }, fullPath: '/checkout' })
    expect(res).toEqual({ path: '/login', query: { redirect: '/checkout' } })
  })

  it('redirects admin routes to admin login when missing admin token', async () => {
    const { useAdminAuthStore } = await import('@/stores/adminAuth')
      ; (useAdminAuthStore as any).mockReturnValueOnce({
        accessToken: null,
        verified: false,
        syncFromStorage: vi.fn(),
        verifyAdmin: vi.fn()
      })

    await import('@/router')
    const g = guards[0]
    const res = await g({ path: '/admin/users', meta: {}, fullPath: '/admin/users' })
    expect(res).toEqual({ path: '/admin/login', query: { redirect: '/admin/users' } })
  })

  it('redirects admin routes to forbidden when verifyAdmin fails', async () => {
    const { useAdminAuthStore } = await import('@/stores/adminAuth')
    const verifyAdmin = vi.fn().mockResolvedValue(false)
      ; (useAdminAuthStore as any).mockReturnValueOnce({
        accessToken: 't',
        verified: false,
        syncFromStorage: vi.fn(),
        verifyAdmin
      })

    await import('@/router')
    const g = guards[0]
    const res = await g({ path: '/admin', meta: {}, fullPath: '/admin' })
    expect(verifyAdmin).toHaveBeenCalled()
    expect(res).toEqual({ path: '/admin/forbidden' })
  })

  it('allows admin routes when verified', async () => {
    const { useAdminAuthStore } = await import('@/stores/adminAuth')
      ; (useAdminAuthStore as any).mockReturnValueOnce({
        accessToken: 't',
        verified: true,
        syncFromStorage: vi.fn(),
        verifyAdmin: vi.fn()
      })

    await import('@/router')
    const g = guards[0]
    const res = await g({ path: '/admin/orders', meta: {}, fullPath: '/admin/orders' })
    expect(res).toBe(true)
  })
})
