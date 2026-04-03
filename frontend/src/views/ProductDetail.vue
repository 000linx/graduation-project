<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const productId = computed(() => String(route.params.id ?? ''))

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const product = ref<any | null>(null)

const fetchProduct = async () => {
  if (!productId.value) return

  loading.value = true
  errorMessage.value = null
  product.value = null

  try {
    const { data } = await axios.get(`/api/product/${encodeURIComponent(productId.value)}`)
    product.value = data?.data ?? null
  } catch (e: any) {
    errorMessage.value = e?.message ?? '获取商品详情失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchProduct)
watch(productId, fetchProduct)
</script>

<template>
  <div class="max-w-4xl mx-auto py-12 px-4">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900">商品详情</h1>
      <router-link to="/" class="text-blue-600 hover:underline">返回首页</router-link>
    </div>

    <div v-if="loading" class="text-gray-500">正在加载...</div>
    <div v-else-if="errorMessage" class="text-red-600">接口错误：{{ errorMessage }}</div>

    <div v-else-if="product" class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="aspect-square bg-gray-50 rounded-xl overflow-hidden">
        <img
          :src="product.image_url ?? 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hearing+aid+product+photo+white+background&image_size=square'"
          :alt="product.name ?? '商品图片'"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="space-y-4 text-left">
        <div class="text-sm text-gray-500">ID：{{ productId }}</div>
        <div class="text-2xl font-bold text-gray-900">{{ product.name ?? '未命名产品' }}</div>
        <div class="text-red-600 text-3xl font-extrabold">¥{{ Number(product.price ?? 0) }}</div>
        <div class="text-gray-600 leading-relaxed whitespace-pre-line">{{ product.description ?? '暂无描述' }}</div>
        <div class="text-sm text-gray-500">分类：{{ product.category ?? '未分类' }}</div>
        <div class="text-sm text-gray-500">库存：{{ product.stock ?? '-' }}</div>
      </div>
    </div>
  </div>
</template>
