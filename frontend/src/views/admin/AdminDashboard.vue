<script setup lang="ts">
import { onMounted, ref } from 'vue'
import http, { unwrap } from '../../api/http'

type Stats = {
  users: number
  products: number
  orders: number
  total_sales: number
}

const loading = ref(false)
const forbidden = ref(false)
const error = ref<string | null>(null)
const stats = ref<Stats | null>(null)

async function fetchStats() {
  loading.value = true
  forbidden.value = false
  error.value = null
  try {
    const resp = await http.get('/api/admin/stats')
    stats.value = unwrap<Stats>(resp)
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 403) forbidden.value = true
    error.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-2xl font-semibold text-gray-900">概览</div>
        <div class="text-sm text-gray-500 mt-1">平台关键数据统计</div>
      </div>
      <el-button :loading="loading" @click="fetchStats">刷新</el-button>
    </div>

    <el-alert v-if="forbidden" type="error" show-icon title="无权限" description="当前账号不是管理员，无法访问后台数据。" />
    <el-alert v-else-if="error" type="error" show-icon :title="error" />

    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="bg-white border rounded-2xl p-5">
        <div class="text-sm text-gray-500">用户数</div>
        <div class="text-3xl font-semibold mt-2">{{ stats.users }}</div>
      </div>
      <div class="bg-white border rounded-2xl p-5">
        <div class="text-sm text-gray-500">商品数</div>
        <div class="text-3xl font-semibold mt-2">{{ stats.products }}</div>
      </div>
      <div class="bg-white border rounded-2xl p-5">
        <div class="text-sm text-gray-500">订单数</div>
        <div class="text-3xl font-semibold mt-2">{{ stats.orders }}</div>
      </div>
      <div class="bg-white border rounded-2xl p-5">
        <div class="text-sm text-gray-500">累计销售额</div>
        <div class="text-3xl font-semibold mt-2">¥{{ Number(stats.total_sales || 0).toFixed(2) }}</div>
      </div>
    </div>
  </div>
</template>

