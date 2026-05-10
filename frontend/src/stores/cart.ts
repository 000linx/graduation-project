import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import http, { unwrap } from '@/api/http'

type CartItem = {
  product_id: string
  quantity: number
}

type ProductInfo = {
  _id: string
  name?: string
  price?: number
  image_url?: string
  category?: string
  stock?: number
}

type CartCache = {
  items: CartItem[]
  products: Record<string, ProductInfo>
  updated_at: number
}

const CACHE_KEY = 'cart_cache_v1'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const products = ref<Record<string, ProductInfo>>({})
  const loading = ref(false)
  const listenerBound = ref(false)

  const totalQty = computed(() => items.value.reduce((sum, it) => sum + Number(it.quantity || 0), 0))

  let _debounceTimer: ReturnType<typeof setTimeout> | null = null
  const _pendingUpdates = new Map<string, number>()

  function _saveCache() {
    const payload: CartCache = {
      items: items.value,
      products: products.value,
      updated_at: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  }

  function loadFromCache() {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw) as CartCache
      if (Array.isArray(data?.items)) items.value = data.items
      if (data?.products && typeof data.products === 'object') products.value = data.products
    } catch {}
  }

  function clearCache() {
    localStorage.removeItem(CACHE_KEY)
    items.value = []
    products.value = {}
  }

  function bindAuthListener() {
    if (listenerBound.value) return
    listenerBound.value = true

    window.addEventListener('auth:logout', () => {
      clearCache()
    })
  }

  async function _ensureProducts(ids: string[]) {
    const missing = ids.filter((id) => !products.value[id])
    if (missing.length === 0) return
    const fetched: Record<string, ProductInfo> = {}
    try {
      const resp = await http.get('/api/product/batch', { params: { ids: missing.join(',') } })
      const data = unwrap<{ items: any[] }>(resp)
      const list = Array.isArray(data?.items) ? data.items : []
      for (const p of list) {
        const pid = String(p?._id ?? p?.id ?? '')
        if (!pid) continue
        fetched[pid] = {
          _id: pid,
          name: p?.name,
          price: Number(p?.price ?? 0),
          image_url: p?.image_url,
          category: p?.category,
          stock: p?.stock
        }
      }
    } catch {}
    products.value = { ...products.value, ...fetched }
  }

  async function fetchCart() {
    loading.value = true
    try {
      const resp = await http.get('/api/cart/items')
      const data = unwrap<{ items: any[]; products?: Record<string, ProductInfo> }>(resp)
      const apiItems = Array.isArray(data?.items) ? data.items : []
      items.value = apiItems.map((it) => ({
        product_id: String(it.product_id),
        quantity: Number(it.quantity ?? 0)
      }))
      if (data?.products && typeof data.products === 'object') {
        products.value = data.products
      } else {
        await _ensureProducts(items.value.map((i) => i.product_id))
      }
      _saveCache()
    } catch (e: any) {
      if (e?.response?.status === 401) clearCache()
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addToCart(productId: string, quantity: number) {
    await http.post('/api/cart/add', { product_id: productId, quantity })
    await fetchCart()
  }

  function _flushBatch() {
    const entries = Array.from(_pendingUpdates.entries())
    _pendingUpdates.clear()
    if (entries.length === 0) return
    const promises = entries.map(([product_id, quantity]) =>
      http.put('/api/cart/update', { product_id, quantity })?.catch(() => {}) ?? Promise.resolve()
    )
    Promise.all(promises).finally(() => {
      _saveCache()
    })
  }

  function _scheduleFlush() {
    if (_debounceTimer) clearTimeout(_debounceTimer)
    _debounceTimer = setTimeout(() => {
      _debounceTimer = null
      _flushBatch()
    }, 300)
  }

  async function updateQty(productId: string, quantity: number) {
    const item = items.value.find((it) => it.product_id === productId)
    if (item) {
      item.quantity = Number(quantity)
      _saveCache()
    }
    _pendingUpdates.set(productId, Number(quantity))
    _scheduleFlush()
  }

  async function updateQtyImmediate(productId: string, quantity: number) {
    await http.put('/api/cart/update', { product_id: productId, quantity })
    const item = items.value.find((it) => it.product_id === productId)
    if (item) item.quantity = Number(quantity)
    _saveCache()
  }

  async function removeItem(productId: string) {
    if (_pendingUpdates.has(productId)) {
      _pendingUpdates.delete(productId)
    }
    await http.delete(`/api/cart/remove/${encodeURIComponent(productId)}`)
    items.value = items.value.filter((it) => it.product_id !== productId)
    _saveCache()
  }

  async function init() {
    bindAuthListener()
    loadFromCache()
    try {
      await fetchCart()
    } catch {}
  }

  return {
    items,
    products,
    totalQty,
    loading,
    init,
    fetchCart,
    addToCart,
    updateQty,
    updateQtyImmediate,
    removeItem,
    loadFromCache,
    clearCache,
    _flushBatch,
    _pendingUpdates
  }
})
