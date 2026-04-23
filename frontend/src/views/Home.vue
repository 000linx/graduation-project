<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import Pagination from '../components/Pagination.vue'
import { ChevronRight } from 'lucide-vue-next'
import axios from 'axios'

const route = useRoute()

const categories = ['全部', '耳背式', '耳内式', '隐形式', '充电款']
const activeCategory = ref('全部')
const currentPage = ref(1)
const totalPages = ref(1)

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
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern+professional+hearing+aid+product+photography+white+background&image_size=square',
    category: '耳背式',
    rating: 4.8
  },
  {
    id: '2',
    name: '隐形深耳道助听器 - 极致轻便',
    price: 4500,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=invisible+in-the-canal+hearing+aid+miniature+technology&image_size=square',
    category: '隐形式',
    rating: 4.9
  },
  {
    id: '3',
    name: '充电式智能助听器 - 24小时续航',
    price: 3200,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=rechargeable+hearing+aid+with+charging+case+sleek+design&image_size=square',
    category: '充电款',
    rating: 4.7
  },
  {
    id: '4',
    name: '老人专用高清助听器 - 操作简便',
    price: 1800,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=behind-the-ear+hearing+aid+for+elderly+clear+sound&image_size=square',
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
          'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hearing+aid+product+photo+white+background&image_size=square'
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
  setupSse()
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
  <div class="space-y-12">
    <!-- Hero Banner -->
    <section class="relative h-[400px] rounded-3xl overflow-hidden bg-[var(--c-primary)] flex items-center">
      <div class="absolute inset-0 opacity-20">
        <img src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=abstract+blue+technology+background+clean+modern&image_size=landscape_16_9" alt="banner" class="w-full h-full object-cover" />
      </div>
      <div class="relative container mx-auto px-12 text-[var(--c-on-primary)] space-y-6">
        <h1 class="text-5xl font-extrabold leading-tight">重新发现<br/>声音的美好</h1>
        <p class="text-xl opacity-90 max-w-lg">全球领先的听力技术，为您提供最专业、最舒适的听力解决方案。</p>
        <router-link
          to="/recommendations"
          v-feedback
          class="a11y-hit bg-[var(--c-on-primary)] text-[var(--c-primary)] px-8 py-3 rounded-full font-extrabold flex items-center space-x-2 w-fit"
          aria-label="去个性化推荐"
        >
          <span>立即选购</span>
          <ChevronRight class="h-5 w-5" />
        </router-link>
      </div>
    </section>

    <!-- Categories -->
    <section>
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-extrabold text-[var(--c-text)]">产品分类</h2>
      </div>
      <div class="flex space-x-4 overflow-x-auto pb-4 no-scrollbar">
        <button
          v-for="cat in categories"
          :key="cat"
          v-feedback
          @click="activeCategory = cat"
          :class="[
            'a11y-hit px-6 py-2.5 rounded-full text-base font-extrabold whitespace-nowrap border-2',
            activeCategory === cat
              ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)] border-[var(--c-primary)]'
              : 'bg-[var(--c-surface)] text-[var(--c-text)] border-[var(--c-border)]'
          ]"
        >
          {{ cat }}
        </button>
      </div>
    </section>

    <!-- Product Grid -->
    <section>
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-extrabold text-[var(--c-text)]">推荐产品</h2>
        <button v-feedback class="a11y-hit text-[var(--c-primary)] font-extrabold underline flex items-center">
          查看全部 <ChevronRight class="h-4 w-4 ml-1" />
        </button>
      </div>
      <div v-if="errorMessage" class="text-[var(--c-danger)] text-base font-bold mb-4">接口错误：{{ errorMessage }}</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <template v-if="loading">
          <div v-for="i in skeletonCount" :key="i" class="bg-[var(--c-surface)] rounded-2xl p-4 border-2 border-[var(--c-border)] shadow-sm">
            <el-skeleton animated>
              <template #template>
                <el-skeleton-item variant="image" style="width: 100%; height: 160px" />
                <div class="mt-4 space-y-2">
                  <el-skeleton-item variant="h3" style="width: 80%" />
                  <el-skeleton-item variant="text" style="width: 60%" />
                  <el-skeleton-item variant="text" style="width: 40%" />
                </div>
              </template>
            </el-skeleton>
          </div>
        </template>

        <template v-else>
          <ProductCard v-for="product in products" :key="product.id" :product="product" />
        </template>
      </div>

      <Pagination
        v-model:currentPage="currentPage"
        :totalPages="totalPages"
      />
    </section>
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
