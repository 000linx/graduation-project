import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import axios from 'axios';
import http, { unwrap } from '../api/http';
const CACHE_KEY = 'cart_cache_v1';
export const useCartStore = defineStore('cart', () => {
    const items = ref([]);
    const products = ref({});
    const loading = ref(false);
    const listenerBound = ref(false);
    const totalQty = computed(() => items.value.reduce((sum, it) => sum + Number(it.quantity || 0), 0));
    function _saveCache() {
        const payload = {
            items: items.value,
            products: products.value,
            updated_at: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    }
    function loadFromCache() {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw)
            return;
        try {
            const data = JSON.parse(raw);
            if (Array.isArray(data?.items))
                items.value = data.items;
            if (data?.products && typeof data.products === 'object')
                products.value = data.products;
        }
        catch {
        }
    }
    function clearCache() {
        localStorage.removeItem(CACHE_KEY);
        items.value = [];
        products.value = {};
    }
    function bindAuthListener() {
        if (listenerBound.value)
            return;
        listenerBound.value = true;
        window.addEventListener('auth:logout', () => {
            clearCache();
        });
        window.addEventListener('storage', (e) => {
            if (e.key === 'access_token' && !e.newValue) {
                clearCache();
            }
        });
    }
    async function _ensureProducts(ids) {
        const missing = ids.filter((id) => !products.value[id]);
        if (missing.length === 0)
            return;
        const fetched = {};
        await Promise.all(missing.map(async (id) => {
            try {
                const { data } = await axios.get(`/api/product/${encodeURIComponent(id)}`);
                const p = (data?.data ?? {});
                const pid = String(p?._id ?? id);
                fetched[pid] = {
                    _id: pid,
                    name: p?.name,
                    price: Number(p?.price ?? 0),
                    image_url: p?.image_url,
                    category: p?.category,
                    stock: p?.stock
                };
            }
            catch {
            }
        }));
        products.value = { ...products.value, ...fetched };
    }
    async function fetchCart() {
        const token = localStorage.getItem('access_token');
        if (!token) {
            clearCache();
            return;
        }
        loading.value = true;
        try {
            const resp = await http.get('/api/cart/items');
            const data = unwrap(resp);
            const apiItems = Array.isArray(data?.items) ? data.items : [];
            items.value = apiItems.map((it) => ({
                product_id: String(it.product_id),
                quantity: Number(it.quantity ?? 0)
            }));
            await _ensureProducts(items.value.map((i) => i.product_id));
            _saveCache();
        }
        finally {
            loading.value = false;
        }
    }
    async function addToCart(productId, quantity) {
        await http.post('/api/cart/add', { product_id: productId, quantity });
        await fetchCart();
    }
    async function updateQty(productId, quantity) {
        await http.put('/api/cart/update', { product_id: productId, quantity });
        await fetchCart();
    }
    async function removeItem(productId) {
        await http.delete(`/api/cart/remove/${encodeURIComponent(productId)}`);
        await fetchCart();
    }
    async function init() {
        bindAuthListener();
        const token = localStorage.getItem('access_token');
        if (!token) {
            clearCache();
            return;
        }
        loadFromCache();
        await fetchCart();
    }
    return { items, products, totalQty, loading, init, fetchCart, addToCart, updateQty, removeItem, loadFromCache, clearCache };
});
//# sourceMappingURL=cart.js.map