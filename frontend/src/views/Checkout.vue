<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import http, { unwrap } from '../api/http'

type CartItem = {
  product_id: string
  quantity: number
}

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const items = ref<CartItem[]>([])

const form = reactive({
  shipping_address: ''
})

const canSubmit = computed(() => items.value.length > 0 && form.shipping_address.trim().length > 0)

async function fetchCart() {
  loading.value = true
  error.value = null
  try {
    const resp = await http.get('/api/cart/items')
    const data = unwrap<{ items: any[] }>(resp)
    const raw = Array.isArray(data?.items) ? data.items : []
    items.value = raw.map((x) => ({
      product_id: String(x.product_id),
      quantity: Number(x.quantity ?? 1)
    }))
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function submitOrder() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const payload = {
      shipping_address: form.shipping_address.trim(),
      items: items.value.map((x) => ({ product_id: x.product_id, quantity: x.quantity }))
    }
    await http.post('/api/order/create', payload)
    ElMessage.success('订单创建成功')
    await router.replace('/profile')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '创建订单失败')
  } finally {
    submitting.value = false
  }
}

onMounted(fetchCart)
</script>

<template>
  <div class="max-w-3xl mx-auto py-12 px-4">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">订单结算</h1>
      <el-button @click="fetchCart" :loading="loading">刷新购物车</el-button>
    </div>

    <el-alert v-if="error" type="error" show-icon :title="error" class="mb-6" />

    <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
      <div class="text-lg font-semibold text-gray-900">商品清单</div>
      <el-table v-loading="loading" :data="items" stripe class="border rounded-xl">
        <el-table-column prop="product_id" label="商品ID" min-width="220" />
        <el-table-column prop="quantity" label="数量" width="120" />
      </el-table>

      <div class="text-lg font-semibold text-gray-900">收货信息</div>
      <el-input v-model="form.shipping_address" placeholder="请输入收货地址" />

      <div class="flex justify-end">
        <el-button type="primary" :disabled="!canSubmit" :loading="submitting" @click="submitOrder">
          提交订单
        </el-button>
      </div>
    </div>
  </div>
</template>
