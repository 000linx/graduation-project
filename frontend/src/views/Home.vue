<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import Pagination from '../components/Pagination.vue'
import { ChevronRight } from 'lucide-vue-next'
import axios from 'axios'

const categories = ['全部', '耳背式', '耳内式', '隐形式', '充电款']
const activeCategory = ref('全部')
const currentPage = ref(1)

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

const fetchProducts = async () => {
  loading.value = true
  errorMessage.value = null

  const params: Record<string, string> = {}
  if (activeCategory.value && activeCategory.value !== '全部') {
    params.category = activeCategory.value
  }

  try {
    const { data } = await axios.get('/api/product/list', { params })
    const apiProducts = Array.isArray(data?.data?.products) ? data.data.products : []
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
  } catch (e: any) {
    errorMessage.value = e?.message ?? '获取产品失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchProducts)
watch(activeCategory, fetchProducts)
</script>

<template>
  <div class="space-y-12">
    <!-- Hero Banner -->
    <section class="relative h-[400px] rounded-3xl overflow-hidden bg-blue-600 flex items-center">
      <div class="absolute inset-0 opacity-20">
        <img src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=abstract+blue+technology+background+clean+modern&image_size=landscape_16_9" alt="banner" class="w-full h-full object-cover" />
      </div>
      <div class="relative container mx-auto px-12 text-white space-y-6">
        <h1 class="text-5xl font-extrabold leading-tight">重新发现<br/>声音的美好</h1>
        <p class="text-xl text-blue-100 max-w-lg">全球领先的听力技术，为您提供最专业、最舒适的听力解决方案。</p>
        <button class="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-all flex items-center space-x-2">
          <span>立即选购</span>
          <ChevronRight class="h-5 w-5" />
        </button>
      </div>
    </section>

    <!-- Categories -->
    <section>
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-gray-900">产品分类</h2>
      </div>
      <div class="flex space-x-4 overflow-x-auto pb-4 no-scrollbar">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="activeCategory = cat"
          :class="[
            'px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
            activeCategory === cat
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          ]"
        >
          {{ cat }}
        </button>
      </div>
    </section>

    <!-- Product Grid -->
    <section>
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-gray-900">推荐产品</h2>
        <button class="text-blue-600 font-medium hover:underline flex items-center">
          查看全部 <ChevronRight class="h-4 w-4 ml-1" />
        </button>
      </div>
      <div v-if="loading" class="text-gray-500 text-sm mb-4">正在加载产品...</div>
      <div v-else-if="errorMessage" class="text-red-600 text-sm mb-4">接口错误：{{ errorMessage }}</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
        />
      </div>

      <Pagination
        v-model:currentPage="currentPage"
        :totalPages="5"
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
