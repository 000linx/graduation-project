import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'

vi.mock('@/api/http', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    },
    unwrap: (resp: any) => resp.data.data
  }
})

vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn()
    }
  }
})

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('fetchCart updates items and totalQty, and writes cache', async () => {
    const http = (await import('@/api/http')).default as any
    const axios = (await import('axios')).default as any

    localStorage.setItem('access_token', 't')
    http.get.mockResolvedValueOnce({
      data: { data: { items: [{ product_id: 'p1', quantity: 2 }] } }
    })
    axios.get.mockResolvedValueOnce({
      data: { data: { _id: 'p1', name: '商品A', price: 10, image_url: '', category: '耳背式', stock: 99 } }
    })

    const store = useCartStore()
    await store.fetchCart()

    expect(store.items.length).toBe(1)
    expect(store.totalQty).toBe(2)
    expect(localStorage.getItem('cart_cache_v1')).toBeTruthy()
  })

  it('addToCart calls API and refreshes cart', async () => {
    const http = (await import('@/api/http')).default as any
    const axios = (await import('axios')).default as any

    localStorage.setItem('access_token', 't')
    http.post.mockResolvedValueOnce({ data: { data: {} } })
    http.get.mockResolvedValueOnce({
      data: { data: { items: [{ product_id: 'p1', quantity: 1 }] } }
    })
    axios.get.mockResolvedValueOnce({
      data: { data: { _id: 'p1', name: '商品A', price: 10 } }
    })

    const store = useCartStore()
    await store.addToCart('p1', 1)

    expect(http.post).toHaveBeenCalledWith('/api/cart/add', { product_id: 'p1', quantity: 1 })
    expect(store.totalQty).toBe(1)
  })

  it('clears cache on auth:logout event', async () => {
    const store = useCartStore()
    localStorage.setItem('cart_cache_v1', JSON.stringify({ items: [{ product_id: 'p1', quantity: 2 }], products: {}, updated_at: Date.now() }))
    localStorage.removeItem('access_token')
    expect(localStorage.getItem('access_token')).toBeNull()
    await store.init()
    expect(store.totalQty).toBe(0)

    localStorage.setItem('access_token', 't')
    const http = (await import('@/api/http')).default as any
    const axios = (await import('axios')).default as any
    http.get.mockResolvedValueOnce({
      data: { data: { items: [{ product_id: 'p1', quantity: 2 }] } }
    })
    axios.get.mockResolvedValueOnce({ data: { data: { _id: 'p1', name: '商品A', price: 10 } } })
    await store.fetchCart()
    expect(store.totalQty).toBe(2)

    window.dispatchEvent(new Event('auth:logout'))
    expect(store.totalQty).toBe(0)
    expect(localStorage.getItem('cart_cache_v1')).toBeNull()
  })
})
