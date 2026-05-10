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

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('fetchCart updates items and totalQty, and writes cache', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({
      data: { data: { items: [{ product_id: 'p1', quantity: 2 }], products: { p1: { _id: 'p1', name: '商品A', price: 10 } } } }
    })

    const store = useCartStore()
    await store.fetchCart()

    expect(store.items.length).toBe(1)
    expect(store.totalQty).toBe(2)
    expect(localStorage.getItem('cart_cache_v1')).toBeTruthy()
  })

  it('addToCart calls API and refreshes cart', async () => {
    const http = (await import('@/api/http')).default as any
    http.post.mockResolvedValueOnce({ data: { data: {} } })
    http.get.mockResolvedValueOnce({
      data: { data: { items: [{ product_id: 'p1', quantity: 1 }], products: { p1: { _id: 'p1', name: '商品A', price: 10 } } } }
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
    await store.init()
    expect(store.totalQty).toBe(2)

    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({
      data: { data: { items: [{ product_id: 'p1', quantity: 2 }], products: { p1: { _id: 'p1', name: '商品A', price: 10 } } } }
    })
    await store.fetchCart()
    expect(store.totalQty).toBe(2)

    window.dispatchEvent(new Event('auth:logout'))
    expect(store.totalQty).toBe(0)
    expect(localStorage.getItem('cart_cache_v1')).toBeNull()
  })

  it('fetchCart clears cache on 401', async () => {
    const http = (await import('@/api/http')).default as any
    localStorage.setItem(
      'cart_cache_v1',
      JSON.stringify({ items: [{ product_id: 'p1', quantity: 2 }], products: {}, updated_at: Date.now() })
    )
    http.get.mockRejectedValueOnce({ response: { status: 401 } })

    const store = useCartStore()
    await store.fetchCart().catch(() => {})

    expect(store.totalQty).toBe(0)
    expect(localStorage.getItem('cart_cache_v1')).toBeNull()
  })

  it('updateQty updates local state immediately and flushes batch via debounce', async () => {
    const http = (await import('@/api/http')).default as any
    const store = useCartStore()

    http.get.mockResolvedValueOnce({
      data: { data: { items: [{ product_id: 'p1', quantity: 1 }], products: { p1: { _id: 'p1', name: '商品A', price: 10 } } } }
    })
    http.put.mockResolvedValueOnce({ data: { data: {} } })
    await store.fetchCart()
    expect(store.totalQty).toBe(1)

    await store.updateQty('p1', 3)
    expect(store.totalQty).toBe(3)

    store._flushBatch()
    expect(http.put).toHaveBeenCalledWith('/api/cart/update', { product_id: 'p1', quantity: 3 })
  })

  it('updateQtyImmediate calls API synchronously', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({
      data: { data: { items: [{ product_id: 'p1', quantity: 1 }], products: { p1: { _id: 'p1', name: '商品A', price: 10 } } } }
    })
    http.put.mockResolvedValueOnce({ data: { data: {} } })

    const store = useCartStore()
    await store.fetchCart()

    await store.updateQtyImmediate('p1', 5)
    expect(http.put).toHaveBeenCalledWith('/api/cart/update', { product_id: 'p1', quantity: 5 })
    expect(store.totalQty).toBe(5)
  })

  it('removeItem calls API and removes from local state', async () => {
    const http = (await import('@/api/http')).default as any

    http.delete.mockResolvedValueOnce({ data: { data: {} } })
    http.get.mockResolvedValueOnce({ data: { data: { items: [{ product_id: 'p1', quantity: 1 }], products: { p1: { _id: 'p1', name: '商品A', price: 10 } } } } })

    const store = useCartStore()
    await store.fetchCart()
    expect(store.totalQty).toBe(1)

    await store.removeItem('p1')

    expect(http.delete).toHaveBeenCalledWith('/api/cart/remove/p1')
    expect(store.totalQty).toBe(0)
  })

})
