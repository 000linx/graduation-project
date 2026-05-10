import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAdminAuthStore } from '@/stores/adminAuth'

vi.mock('@/api/http', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn()
    },
    unwrap: (resp: any) => resp.data.data
  }
})

describe('adminAuth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('login persists tokens and permissions', async () => {
    const http = (await import('@/api/http')).default as any
    http.post.mockResolvedValueOnce({
      data: { data: { tokens: { access_token: 'at', refresh_token: 'rt' }, user: { phone: '1', username: 'u' }, permissions: ['p1'] } }
    })

    const store = useAdminAuthStore()
    await store.login('1', 'pwd')

    expect(store.isAuthed).toBe(true)
    expect(store.permissions).toEqual(['p1'])
    expect(store.verified).toBe(true)
  })

  it('login throws when missing access_token', async () => {
    const http = (await import('@/api/http')).default as any
    http.post.mockResolvedValueOnce({ data: { data: { tokens: { refresh_token: 'rt' } } } })

    const store = useAdminAuthStore()
    await expect(store.login('1', 'pwd')).rejects.toThrow()
  })

  it('verifyAdmin returns false when invalid session', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockRejectedValueOnce(new Error('nope'))
    const store = useAdminAuthStore()
    const ok = await store.verifyAdmin()
    expect(ok).toBe(false)
    expect(store.permissions).toEqual([])
    expect(store.verified).toBe(false)
  })

  it('verifyAdmin refreshes permissions when token valid', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({ data: { data: { permissions: ['a', 'b'] } } })

    const store = useAdminAuthStore()
    const ok = await store.verifyAdmin()
    expect(ok).toBe(true)
    expect(store.permissions).toEqual(['a', 'b'])
    expect(store.verified).toBe(true)
  })

  it('verifyAdmin logs out when token invalid', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockRejectedValueOnce(new Error('nope'))

    const store = useAdminAuthStore()
    const ok = await store.verifyAdmin()
    expect(ok).toBe(false)
    expect(store.isAuthed).toBe(false)
  })
})
