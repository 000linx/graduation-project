<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import Pagination from '@/components/Pagination.vue'
import { ChevronRight } from 'lucide-vue-next'
import axios from 'axios'
import { useRouter } from 'vue-router'
import HomeHeroCarousel from '@/components/home/HomeHeroCarousel.vue'
import HomeLiveStats from '@/components/home/HomeLiveStats.vue'
import HomeTrustTiles from '@/components/home/HomeTrustTiles.vue'
import HomeSidebar from '@/components/home/HomeSidebar.vue'
import HomeGuideCard from '@/components/home/HomeGuideCard.vue'
import hero1 from '@/assets/hero/hero-1.svg'
import hero2 from '@/assets/hero/hero-2.svg'
import hero3 from '@/assets/hero/hero-3.svg'
import productPlaceholder from '@/assets/placeholders/product-square.svg'

const route = useRoute()
const router = useRouter()

const categories = ['全部', '耳背式', '耳内式', '隐形式', '充电款']
const activeCategory = ref('全部')
const currentPage = ref(1)
const totalPages = ref(1)

const heroSlides = [
  {
    title: '重新发现\n声音的美好',
    subtitle: '专业听力技术与适老设计，帮助你更轻松地参与交流。',
    image: hero1,
    ctaText: '立即选购',
    to: '/recommendations'
  },
  {
    title: '更安心的\n佩戴体验',
    subtitle: '从隐形式到充电款，覆盖不同预算与生活场景。',
    image: hero2,
    ctaText: '查看推荐',
    to: '/recommendations'
  },
  {
    title: '从需求出发\n快速匹配',
    subtitle: '填写听力画像，获得可解释的推荐与更清晰的对比。',
    image: hero3,
    ctaText: '开始匹配',
    to: '/recommendations'
  }
]

const guideCards = [
  {
    badge: '新手推荐',
    title: '3分钟了解怎么选',
    desc: '从听损等级、预算与日常场景出发，减少试错。',
    to: '/recommendations'
  },
  {
    badge: '售后说明',
    title: '看懂试戴与退换',
    desc: '把重要规则说清楚：试戴、退换、发票与维修。',
    to: '/#support'
  },
  {
    badge: '适老友好',
    title: '家属代买也不慌',
    desc: '清晰信息与大字号支持，帮你为家人做决定。',
    to: '/recommendations'
  },
  {
    badge: '对比技巧',
    title: '关注这3个关键点',
    desc: '降噪/续航/佩戴舒适度，快速挑出合适款。',
    to: '/recommendations'
  }
]

const guideCount = computed(() => {
  if (loading.value) return 0
  const need = 8 - products.value.length
  if (need <= 0) return 0
  return Math.min(4, need)
})

const activeFilterText = computed(() => {
  const parts: string[] = []
  if (activeCategory.value && activeCategory.value !== '全部') parts.push(activeCategory.value)
  if (keyword.value) parts.push(`关键词：${keyword.value}`)
  return parts.length ? parts.join(' · ') : '全部商品'
})

function resetFilters() {
  activeCategory.value = '全部'
  currentPage.value = 1
  router.push({ path: '/', query: {} })
}

const keyword = computed(() => {
  const q = route.query.q
  return typeof q === 'string' ? q.trim() : ''
})

type ProductCardItem = {
  id: string
  name: string
  price: number
  image: string
  category: string
  rating: number
}

const products = ref<ProductCardItem[]>([
  {
    id: '1',
    name: '专业级智能降噪助听器 - 高性能款',
    price: 2999,
    image: productPlaceholder,
    category: '耳背式',
    rating: 4.8
  },
  {
    id: '2',
    name: '隐形深耳道助听器 - 极致轻便',
    price: 4500,
    image: productPlaceholder,
    category: '隐形式',
    rating: 4.9
  },
  {
    id: '3',
    name: '充电式智能助听器 - 24小时续航',
    price: 3200,
    image: productPlaceholder,
    category: '充电款',
    rating: 4.7
  },
  {
    id: '4',
    name: '老人专用高清助听器 - 操作简便',
    price: 1800,
    image: productPlaceholder,
    category: '耳背式',
    rating: 4.6
  }
])

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const skeletonCount = 12

let es: EventSource | null = null
let sseTimer: number | null = null

function scheduleFetch() {
  if (sseTimer) window.clearTimeout(sseTimer)
  sseTimer = window.setTimeout(() => {
    fetchProducts()
  }, 200)
}

const fetchProducts = async () => {
  loading.value = true
  errorMessage.value = null

  const params: Record<string, any> = {
    page: currentPage.value,
    page_size: 12
  }
  if (activeCategory.value && activeCategory.value !== '全部') {
    params.category = activeCategory.value
  }
  if (keyword.value) {
    params.q = keyword.value
  }

  try {
    const { data } = await axios.get('/api/product/list', { params })
    const apiProducts = Array.isArray(data?.data?.products) ? data.data.products : []
    const apiPagination = data?.data?.pagination
    products.value = apiProducts.map((p: any) => ({
      id: String(p._id ?? p.id ?? ''),
      name: String(p.name ?? '未命名产品'),
      price: Number(p.price ?? 0),
      image: String(
        p.image_url ??
          p.image ??
          productPlaceholder
      ),
      category: String(p.category ?? '未分类'),
      rating: Number(p.rating ?? 4.6)
    }))
    totalPages.value = Number(apiPagination?.total_pages ?? 1) || 1
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  } catch (e: any) {
    errorMessage.value = e?.message ?? '获取产品失败'
  } finally {
    loading.value = false
  }
}

function setupSse() {
  try {
    es = new EventSource('/api/product/stream')
    es.addEventListener('products', () => {
      scheduleFetch()
    })
    es.addEventListener('ping', () => {})
    es.onerror = () => {
      try {
        es?.close()
      } catch {}
      es = null
    }
  } catch {
    es = null
  }
}

onMounted(() => {
  fetchProducts()
  const idle = (cb: () => void) => {
    const ric = (window as any).requestIdleCallback as undefined | ((fn: () => void, opts?: { timeout?: number }) => void)
    if (typeof ric === 'function') {
      ric(cb, { timeout: 2500 })
      return
    }
    window.setTimeout(cb, 1200)
  }
  idle(() => setupSse())
})

onBeforeUnmount(() => {
  if (sseTimer) window.clearTimeout(sseTimer)
  try {
    es?.close()
  } catch {}
  es = null
})
watch([activeCategory, keyword], () => {
  currentPage.value = 1
})

watch([activeCategory, currentPage, keyword], () => {
  if (currentPage.value < 1) currentPage.value = 1
  fetchProducts()
})
</script>

<template>
  <div class="space-y-8 lg:space-y-10">
    <HomeHeroCarousel :slides="heroSlides" />

    <HomeLiveStats :productCount="products.length" />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-9 space-y-8">
        <!-- Categories -->
        <section aria-label="商品分类">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-extrabold text-[var(--c-text)]">产品分类</h2>
              <span class="text-xs font-extrabold px-3 py-1 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-muted)]">
                {{ activeFilterText }}
              </span>
            </div>
            <button
              v-feedback
              type="button"
              class="a11y-hit text-[var(--c-primary)] font-extrabold underline flex items-center w-fit"
              aria-label="清除筛选"
              @click="resetFilters"
            >
              清除筛选 <ChevronRight class="h-4 w-4 ml-1" aria-hidden="true" />
            </button>
          </div>
          <div class="flex space-x-4 overflow-x-auto pb-4 no-scrollbar">
            <button
              v-for="cat in categories"
              :key="cat"
              v-feedback
              type="button"
              @click="activeCategory = cat"
              :class="[
                'a11y-hit px-6 py-2.5 rounded-full text-base font-extrabold whitespace-nowrap border-2',
                activeCategory === cat
                  ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)] border-[var(--c-primary)]'
                  : 'bg-[var(--c-surface)] text-[var(--c-text)] border-[var(--c-border)]'
              ]"
              :aria-label="`筛选分类：${cat}`"
            >
              {{ cat }}
            </button>
          </div>
        </section>

        <HomeTrustTiles />

        <!-- Product Grid -->
        <section aria-label="推荐产品">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-5">
            <div>
              <h2 class="text-2xl font-extrabold text-[var(--c-text)]">推荐产品</h2>
              <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">覆盖不同佩戴方式与预算区间，支持对比与快速加购。</div>
            </div>
            <button
              v-feedback
              type="button"
              class="a11y-hit text-[var(--c-primary)] font-extrabold underline flex items-center w-fit"
              aria-label="返回全部推荐"
              @click="resetFilters"
            >
              查看全部 <ChevronRight class="h-4 w-4 ml-1" aria-hidden="true" />
            </button>
          </div>

          <div v-if="errorMessage" class="text-[var(--c-danger)] text-base font-bold mb-4">接口错误：{{ errorMessage }}</div>
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            :aria-busy="loading ? 'true' : 'false'"
          >
            <template v-if="loading">
              <div v-for="i in skeletonCount" :key="i" class="bg-[var(--c-surface)] rounded-2xl p-4 border-2 border-[var(--c-border)] shadow-sm">
                <div class="animate-pulse">
                  <div class="w-full h-40 rounded-xl bg-[var(--c-border)]/10" />
                  <div class="mt-4 space-y-2">
                    <div class="h-4 w-4/5 rounded bg-[var(--c-border)]/10" />
                    <div class="h-3 w-3/5 rounded bg-[var(--c-border)]/10" />
                    <div class="h-3 w-2/5 rounded bg-[var(--c-border)]/10" />
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <ProductCard v-for="product in products" :key="product.id" :product="product" />
              <HomeGuideCard
                v-for="(c, idx) in guideCards.slice(0, guideCount)"
                :key="idx"
                :title="c.title"
                :desc="c.desc"
                :to="c.to"
                :badge="c.badge"
              />
            </template>
          </div>

          <Pagination v-model:currentPage="currentPage" :totalPages="totalPages" />
        </section>

        <section
          id="support"
          class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-6 lg:p-8"
          aria-label="售后与无障碍支持"
        >
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div class="lg:col-span-8">
              <div class="text-2xl font-extrabold text-[var(--c-text)]">售后保障与无障碍承诺</div>
              <div class="mt-2 text-sm font-semibold text-[var(--c-muted)] leading-relaxed">
                全站支持键盘操作、清晰焦点、高对比与大字号；关键状态会读屏播报。购买相关规则用更明确的语言表达，减少误解。
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <span class="px-3 py-1 rounded-full border-2 border-[var(--c-border)] text-xs font-extrabold">命中区 ≥ 48px</span>
                <span class="px-3 py-1 rounded-full border-2 border-[var(--c-border)] text-xs font-extrabold">WCAG 2.1 AA</span>
                <span class="px-3 py-1 rounded-full border-2 border-[var(--c-border)] text-xs font-extrabold">减少动效支持</span>
              </div>
            </div>
            <div class="lg:col-span-4 flex flex-col gap-3">
              <router-link
                to="/recommendations"
                v-feedback
                class="a11y-hit justify-center rounded-2xl bg-[var(--c-primary)] text-[var(--c-on-primary)] font-extrabold no-underline"
                aria-label="去个性化推荐"
              >
                去个性化推荐
              </router-link>
              <router-link
                to="/profile"
                v-feedback
                class="a11y-hit justify-center rounded-2xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold no-underline"
                aria-label="查看订单与地址管理"
              >
                订单与地址
              </router-link>
            </div>
          </div>
        </section>
      </div>

      <div class="lg:col-span-3">
        <HomeSidebar />
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
