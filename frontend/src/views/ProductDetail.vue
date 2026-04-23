<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const productId = computed(() => String(route.params.id ?? ''))

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const product = ref<any | null>(null)
const cart = useCartStore()
const adding = ref(false)
const qty = ref(1)

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

async function addToCart() {
  const token = localStorage.getItem('access_token')
  if (!token) {
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

        <div class="pt-4 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-3">
            <div class="text-sm text-gray-600">数量</div>
            <el-input-number
              v-model="qty"
              :min="1"
              :max="Math.max(1, Number(product.stock ?? 1))"
              size="small"
            />
          </div>
          <el-button
            type="primary"
            class="sm:ml-auto"
            :loading="adding"
            :disabled="Number(product.stock ?? 0) <= 0"
            @click="addToCart"
          >
            加入购物车
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>
