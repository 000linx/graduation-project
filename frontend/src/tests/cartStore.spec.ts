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
    localStorage.setItem(
      'cart_cache_v1',
      JSON.stringify({ items: [{ product_id: 'p1', quantity: 2 }], products: {}, updated_at: Date.now() })
    )
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

  it('fetchCart clears cache when no user token', async () => {
    localStorage.setItem(
      'cart_cache_v1',
      JSON.stringify({ items: [{ product_id: 'p1', quantity: 2 }], products: {}, updated_at: Date.now() })
    )
    localStorage.removeItem('access_token')

    const store = useCartStore()
    await store.fetchCart()

    expect(store.totalQty).toBe(0)
    expect(localStorage.getItem('cart_cache_v1')).toBeNull()
  })

  it('updateQty calls API and refreshes', async () => {
    const http = (await import('@/api/http')).default as any
    const axios = (await import('axios')).default as any

    localStorage.setItem('access_token', 't')
    http.put.mockResolvedValueOnce({ data: { data: {} } })
    http.get.mockResolvedValueOnce({ data: { data: { items: [{ product_id: 'p1', quantity: 3 }] } } })
    axios.get.mockResolvedValueOnce({ data: { data: { _id: 'p1', name: '商品A', price: 10 } } })

    const store = useCartStore()
    await store.updateQty('p1', 3)

    expect(http.put).toHaveBeenCalledWith('/api/cart/update', { product_id: 'p1', quantity: 3 })
    expect(store.totalQty).toBe(3)
  })

  it('removeItem calls API and refreshes', async () => {
    const http = (await import('@/api/http')).default as any

    localStorage.setItem('access_token', 't')
    http.delete.mockResolvedValueOnce({ data: { data: {} } })
    http.get.mockResolvedValueOnce({ data: { data: { items: [] } } })

    const store = useCartStore()
    await store.removeItem('p1')

    expect(http.delete).toHaveBeenCalledWith('/api/cart/remove/p1')
    expect(store.totalQty).toBe(0)
  })

  it('clears cache when access_token removed in storage event', async () => {
    const http = (await import('@/api/http')).default as any
    const store = useCartStore()
    localStorage.setItem(
      'cart_cache_v1',
      JSON.stringify({ items: [{ product_id: 'p1', quantity: 2 }], products: {}, updated_at: Date.now() })
    )
    localStorage.setItem('access_token', 't')
    http.get.mockResolvedValueOnce({ data: { data: { items: [] } } })
    await store.init()

    window.dispatchEvent(new StorageEvent('storage', { key: 'access_token', newValue: null }))
    expect(localStorage.getItem('cart_cache_v1')).toBeNull()
  })
})
