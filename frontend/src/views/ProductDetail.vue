<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { BadgeCheck, ChevronRight, ShieldCheck, Star, Truck } from 'lucide-vue-next'
import ProductCard from '../components/ProductCard.vue'
import { useCartStore } from '../stores/cart'
import { useUserAuthStore } from '../stores/userAuth'
import productPlaceholder from '@/assets/placeholders/product-square.svg'

const route = useRoute()
const router = useRouter()
const productId = computed(() => String(route.params.id ?? ''))

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const product = ref<any | null>(null)
const cart = useCartStore()
const userAuth = useUserAuthStore()
const adding = ref(false)
const qty = ref(1)

type ProductCardItem = {
  id: string
  name: string
  price: number
  image: string
  category: string
  rating: number
}

const relatedLoading = ref(false)
const related = ref<ProductCardItem[]>([])

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

async function fetchRelated() {
  const cat = String(product.value?.category ?? '').trim()
  if (!cat) {
    related.value = []
    return
  }
  relatedLoading.value = true
  try {
    const { data } = await axios.get('/api/product/list', {
      params: { page: 1, page_size: 8, category: cat }
    })
    const apiProducts = Array.isArray(data?.data?.products) ? data.data.products : []
    const cards = apiProducts.map(mapToCard).filter((x: ProductCardItem) => x.id && x.id !== productId.value)
    related.value = cards.slice(0, 4)
  } catch {
    related.value = []
  } finally {
    relatedLoading.value = false
  }
}

const fetchProduct = async () => {
  if (!productId.value) return

  loading.value = true
  errorMessage.value = null
  product.value = null

  try {
    const { data } = await axios.get(`/api/product/${encodeURIComponent(productId.value)}`)
    product.value = data?.data ?? null
    await fetchRelated()
  } catch (e: any) {
    errorMessage.value = e?.message ?? '获取商品详情失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchProduct)
watch(productId, fetchProduct)

async function addToCart() {
  const ok = userAuth.verified ? true : await userAuth.verifyUser()
  if (!ok) {
    ElMessage.warning('请先登录后再加入购物车')
    await router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!productId.value) return
  if (adding.value) return

  const stock = Number(product.value?.stock ?? 0)
  if (stock <= 0) {
    ElMessage.error('库存不足')
    return
  }

  adding.value = true
  try {
    await cart.addToCart(productId.value, Number(qty.value || 1))
    ElMessage.success('已加入购物车')
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 401) {
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
    }
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto py-10 px-4">
    <nav class="flex flex-nowrap items-center gap-2 text-sm overflow-x-auto" aria-label="面包屑">
      <router-link
        to="/"
        class="font-extrabold text-[var(--c-primary)] no-underline"
        v-feedback
        aria-label="返回首页"
        >首页</router-link
      >
      <ChevronRight class="h-4 w-4 icon-tone--muted" aria-hidden="true" />
      <router-link
        to="/"
        class="font-extrabold text-[var(--c-primary)] no-underline"
        v-feedback
        aria-label="返回列表"
      >
        商品
      </router-link>
      <template v-if="product?.category">
        <ChevronRight class="h-4 w-4 icon-tone--muted" aria-hidden="true" />
        <span class="font-semibold text-[var(--c-muted)]">{{ product.category }}</span>
      </template>
    </nav>

    <div class="flex items-center justify-between mt-5 mb-6">
      <h1 class="text-2xl lg:text-3xl font-extrabold text-[var(--c-text)]">商品详情</h1>
      <router-link
        to="/"
        class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] font-extrabold no-underline"
        v-feedback
        aria-label="返回首页"
      >
        返回首页
      </router-link>
    </div>

    <div v-if="loading" class="text-[var(--c-muted)] font-semibold">正在加载...</div>
    <div v-else-if="errorMessage" class="text-[var(--c-danger)] font-bold">接口错误：{{ errorMessage }}</div>

    <div
      v-else-if="product"
      class="bg-[var(--c-surface)] rounded-3xl p-6 lg:p-8 shadow-sm border-2 border-[var(--c-border)] grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <div
        class="aspect-square bg-[var(--c-bg)] rounded-2xl overflow-hidden border-2 border-[var(--c-border)]"
      >
        <img
          :src="product.image_url ?? productPlaceholder"
          :alt="product.name ?? '商品图片'"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="space-y-5 text-left">
        <div class="text-sm font-semibold text-[var(--c-muted)]">ID：{{ productId }}</div>
        <div class="text-2xl font-extrabold text-[var(--c-text)]">{{ product.name ?? '未命名产品' }}</div>
        <div class="flex flex-nowrap items-center gap-3 overflow-x-auto">
          <div class="text-[var(--c-danger)] text-3xl font-extrabold">¥{{ Number(product.price ?? 0) }}</div>
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)]"
            :aria-label="`评分 ${Number(product.rating ?? 4.6).toFixed(1)}`"
          >
            <Star class="h-4 w-4 icon-tone--warning" aria-hidden="true" />
            <span class="text-sm font-extrabold text-[var(--c-text)]">{{
              Number(product.rating ?? 4.6).toFixed(1)
            }}</span>
            <span class="text-xs font-semibold text-[var(--c-muted)]">口碑精选</span>
          </div>
        </div>

        <div class="text-sm font-semibold text-[var(--c-muted)] leading-relaxed whitespace-nowrap overflow-x-auto">
          {{ product.description ?? '暂无描述。你可以先去个性化推荐填写画像，我们会给出更合适的匹配建议。' }}
        </div>

        <div class="flex flex-nowrap gap-2 overflow-x-auto" aria-label="卖点">
          <span
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full border-2 border-[var(--c-border)] text-xs font-extrabold"
          >
            <ShieldCheck class="h-3.5 w-3.5 icon-tone--success icon--micro" aria-hidden="true" />
            安心售后
          </span>
          <span
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full border-2 border-[var(--c-border)] text-xs font-extrabold"
          >
            <BadgeCheck class="h-3.5 w-3.5 icon-tone--success icon--micro" aria-hidden="true" />
            适配建议
          </span>
          <span
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full border-2 border-[var(--c-border)] text-xs font-extrabold"
          >
            <Truck class="h-3.5 w-3.5 icon-tone--info icon--micro" aria-hidden="true" />
            可追踪配送
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold text-[var(--c-muted)]">
          <div>分类：{{ product.category ?? '未分类' }}</div>
          <div>库存：{{ product.stock ?? '-' }}</div>
        </div>

        <div
          class="pt-4 border-t border-[var(--c-border)]/30 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div class="flex items-center gap-3">
            <div class="text-sm font-semibold text-[var(--c-muted)]">数量</div>
            <el-input-number
              v-model="qty"
              :min="1"
              :max="Math.max(1, Number(product.stock ?? 1))"
              size="small"
            />
          </div>
          <el-button
            type="primary"
            data-testid="product-detail-add"
            class="sm:ml-auto"
            :loading="adding"
            :disabled="Number(product.stock ?? 0) <= 0"
            @click="addToCart"
          >
            加入购物车
          </el-button>
        </div>

        <el-collapse class="border-2 border-[var(--c-border)] rounded-2xl overflow-hidden">
          <el-collapse-item title="购买须知" name="1">
            <div class="text-sm font-semibold text-[var(--c-muted)] leading-relaxed">
              建议先确认佩戴方式与日常场景；如为家属代买，可先在推荐页填写画像以获得更准确的匹配。
            </div>
          </el-collapse-item>
          <el-collapse-item title="售后保障" name="2">
            <div class="text-sm font-semibold text-[var(--c-muted)] leading-relaxed">
              支持订单状态追踪、售后申请与评价；重要状态会通过页面提示与读屏播报同步。
            </div>
          </el-collapse-item>
          <el-collapse-item title="常见问题" name="3">
            <div class="text-sm font-semibold text-[var(--c-muted)] leading-relaxed">
              若你对音量、降噪或续航有强需求，请优先查看推荐理由与同类对比；如需帮助可在个人中心查看订单与售后入口。
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <section v-if="related.length" class="mt-8" aria-label="相关推荐">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-extrabold text-[var(--c-text)]">同类相关推荐</h2>
        <router-link
          to="/recommendations"
          v-feedback
          class="a11y-hit text-[var(--c-primary)] font-extrabold underline flex items-center no-underline"
          aria-label="去个性化推荐"
        >
          去推荐 <ChevronRight class="h-4 w-4 ml-1 icon-tone--muted" aria-hidden="true" />
        </router-link>
      </div>
      <div v-loading="relatedLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductCard v-for="p in related" :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>
