<template>
  <div class="max-w-4xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold mb-8">您的购物车</h1>
    <el-alert v-if="!hasToken" type="warning" show-icon title="未登录" description="请先登录后查看购物车。" class="mb-6" />

    <div v-else-if="cart.totalQty === 0" class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
      <div class="text-gray-400 mb-6">
        <ShoppingCart class="h-16 w-16 mx-auto" />
      </div>
      <p class="text-xl font-medium text-gray-900 mb-2">购物车还是空的</p>
      <p class="text-gray-500 mb-8">赶紧去选购您心仪的助听器吧！</p>
      <router-link to="/" class="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all">
        去逛逛
      </router-link>
    </div>

    <div v-else class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
      <el-table :data="tableRows" stripe size="small" class="border rounded-xl" v-loading="cart.loading">
        <el-table-column label="商品" min-width="260">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <img :src="row.image" class="w-12 h-12 rounded object-cover bg-gray-50 border" />
              <div class="min-w-0">
                <div class="font-medium text-gray-900 truncate">{{ row.name }}</div>
                <div class="text-xs text-gray-500 truncate">{{ row.category }}</div>
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

      <div class="flex items-center justify-between pt-2">
        <div class="text-sm text-gray-500">共 {{ cart.totalQty }} 件商品</div>
        <div class="flex items-center gap-4">
          <div class="text-base font-semibold text-gray-900">合计：¥{{ totalAmount.toFixed(2) }}</div>
          <router-link to="/checkout">
            <el-button type="primary">去结算</el-button>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart } from 'lucide-vue-next'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const cart = useCartStore()
const hasToken = ref(false)

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
      image: String(
        p?.image_url ??
          'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hearing+aid+product+photo+white+background&image_size=square'
      ),
      category: String(p?.category ?? '')
    }
  })
})

const totalAmount = computed(() => tableRows.value.reduce((sum, r) => sum + r.price * r.quantity, 0))

async function onQtyChange(productId: string, v: number) {
  const token = localStorage.getItem('access_token')
  if (!token) {
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
  hasToken.value = Boolean(localStorage.getItem('access_token'))
  await cart.init()
})
</script>
