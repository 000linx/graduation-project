<template>
  <div class="max-w-6xl mx-auto py-10 px-4">
    <h1 class="text-3xl font-extrabold mb-8 text-[var(--c-text)]">您的购物车</h1>
    <el-alert
      v-if="!hasToken"
      type="warning"
      show-icon
      title="未登录"
      description="请先登录后查看购物车。"
      class="mb-6"
    />

    <div
      v-else-if="cart.totalQty === 0"
      class="bg-[var(--c-surface)] rounded-3xl p-8 shadow-sm border-2 border-[var(--c-border)] text-center"
    >
      <div class="text-[var(--c-muted)] mb-6">
        <ShoppingCart class="h-16 w-16 mx-auto icon-tone--info" />
      </div>
      <p class="text-xl font-extrabold text-[var(--c-text)] mb-2">购物车还是空的</p>
      <p class="text-[var(--c-muted)] font-semibold mb-8">赶紧去选购你心仪的助听器吧！</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <router-link
          to="/"
          v-feedback
          class="a11y-hit px-8 rounded-full font-extrabold bg-[var(--c-primary)] text-[var(--c-on-primary)] no-underline"
        >
          去逛逛
        </router-link>
        <router-link
          to="/recommendations"
          v-feedback
          class="a11y-hit px-8 rounded-full font-extrabold border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] no-underline"
        >
          去个性化推荐
        </router-link>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div
        class="lg:col-span-8 bg-[var(--c-surface)] rounded-3xl p-6 shadow-sm border-2 border-[var(--c-border)] space-y-4"
      >
        <el-table :data="tableRows" stripe size="small" class="border rounded-xl" v-loading="cart.loading">
          <el-table-column label="商品" min-width="260">
            <template #default="{ row }">
              <div class="flex items-center gap-3">
                <img
                  :src="row.image"
                  :alt="row.name"
                  class="w-12 h-12 rounded object-cover bg-[var(--c-bg)] border-2 border-[var(--c-border)]"
                />
                <div class="min-w-0">
                  <div class="font-extrabold text-[var(--c-text)] truncate">{{ row.name }}</div>
                  <div class="text-xs font-semibold text-[var(--c-muted)] truncate">{{ row.category }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="数量" width="160">
            <template #default="{ row }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :max="999"
                size="small"
                @change="(v: number) => onQtyChange(row.product_id, v)"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="140">
            <template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" @click="remove(row.product_id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <aside class="lg:col-span-4 space-y-4" aria-label="结算摘要">
        <div class="bg-[var(--c-surface)] rounded-3xl p-6 shadow-sm border-2 border-[var(--c-border)]">
          <div class="text-lg font-extrabold text-[var(--c-text)]">订单摘要</div>
          <div class="mt-4 space-y-2 text-sm font-semibold text-[var(--c-muted)]">
            <div class="flex items-center justify-between">
              <span>商品件数</span>
              <span class="font-extrabold text-[var(--c-text)]">{{ cart.totalQty }} 件</span>
            </div>
            <div class="flex items-center justify-between">
              <span>商品金额</span>
              <span class="font-extrabold text-[var(--c-text)]">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>运费</span>
              <span class="font-extrabold text-[var(--c-text)]">¥0.00</span>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-[var(--c-border)]/30 flex items-center justify-between">
            <span class="text-sm font-semibold text-[var(--c-muted)]">应付</span>
            <span class="text-2xl font-extrabold text-[var(--c-text)]">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
          <router-link to="/checkout" class="block mt-4" data-testid="cart-checkout-link">
            <el-button type="primary" class="w-full" data-testid="cart-checkout-button">去结算</el-button>
          </router-link>
          <div class="mt-3 text-xs font-semibold text-[var(--c-muted)]">
            支持键盘操作与读屏提示，结算页可选择地址与支付方式。
          </div>
        </div>

        <div
          v-if="recommended.length"
          class="bg-[var(--c-surface)] rounded-3xl p-6 shadow-sm border-2 border-[var(--c-border)]"
        >
          <div class="text-lg font-extrabold text-[var(--c-text)] mb-4">你可能还需要</div>
          <div v-loading="recoLoading" class="grid grid-cols-1 gap-4">
            <ProductCard v-for="p in recommended" :key="p.id" :product="p" />
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart } from 'lucide-vue-next'
import axios from 'axios'
import ProductCard from '../components/ProductCard.vue'
import { useCartStore } from '../stores/cart'
import { useUserAuthStore } from '../stores/userAuth'
import productPlaceholder from '@/assets/placeholders/product-square.svg'

const router = useRouter()
const cart = useCartStore()
const userAuth = useUserAuthStore()
const hasToken = computed(() => userAuth.verified)

type Row = {
  product_id: string
  quantity: number
  name: string
  price: number
  image: string
  category: string
}

const tableRows = computed<Row[]>(() => {
  return cart.items.map((it) => {
    const p = cart.products[it.product_id]
    return {
      product_id: it.product_id,
      quantity: it.quantity,
      name: String(p?.name ?? '商品'),
      price: Number(p?.price ?? 0),
      image: String(p?.image_url ?? productPlaceholder),
      category: String(p?.category ?? '')
    }
  })
})

const totalAmount = computed(() => tableRows.value.reduce((sum, r) => sum + r.price * r.quantity, 0))

type ProductCardItem = {
  id: string
  name: string
  price: number
  image: string
  category: string
  rating: number
}

const recommended = ref<ProductCardItem[]>([])
const recoLoading = ref(false)
let recoTimer: number | null = null

function mapToCard(p: any): ProductCardItem {
  return {
    id: String(p._id ?? p.id ?? ''),
    name: String(p.name ?? '未命名产品'),
    price: Number(p.price ?? 0),
    image: String(p.image_url ?? p.image ?? productPlaceholder),
    category: String(p.category ?? '未分类'),
    rating: Number(p.rating ?? 4.6)
  }
}

async function fetchReco() {
  const cat = String(tableRows.value[0]?.category ?? '').trim()
  recoLoading.value = true
  try {
    const { data } = await axios.get('/api/product/list', {
      params: { page: 1, page_size: 6, ...(cat ? { category: cat } : {}) }
    })
    const apiProducts = Array.isArray(data?.data?.products) ? data.data.products : []
    const exists = new Set(tableRows.value.map((r) => r.product_id))
    const cards = apiProducts.map(mapToCard).filter((x: ProductCardItem) => x.id && !exists.has(x.id))
    recommended.value = cards.slice(0, 2)
  } catch {
    recommended.value = []
  } finally {
    recoLoading.value = false
  }
}

async function onQtyChange(productId: string, v: number) {
  const ok = userAuth.verified ? true : await userAuth.verifyUser()
  if (!ok) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: '/cart' } })
    return
  }
  try {
    await cart.updateQty(productId, Number(v))
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '更新失败')
  }
}

async function remove(productId: string) {
  try {
    await cart.removeItem(productId)
    ElMessage.success('已删除')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

onMounted(async () => {
  await userAuth.verifyUser()
  await cart.init()
  if (hasToken.value && cart.totalQty > 0) await fetchReco()
})

watch(
  () => tableRows.value.map((r) => `${r.product_id}:${r.quantity}`).join('|'),
  () => {
    if (!hasToken.value || cart.totalQty === 0) {
      recommended.value = []
      return
    }
    if (recoTimer) window.clearTimeout(recoTimer)
    recoTimer = window.setTimeout(() => {
      fetchReco()
    }, 250)
  }
)

onBeforeUnmount(() => {
  if (recoTimer) window.clearTimeout(recoTimer)
  recoTimer = null
})
</script>
