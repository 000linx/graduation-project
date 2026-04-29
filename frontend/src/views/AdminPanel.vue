<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-8 text-gray-900">管理后台</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
      >
        <p class="text-sm font-medium text-gray-500 mb-1">{{ stat.label }}</p>
        <p class="text-3xl font-bold text-gray-900">{{ stat.value }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const stats = [
  { label: '今日销售额', value: '¥12,450' },
  { label: '新增订单', value: '18' },
  { label: '活跃用户', value: '156' }
]
</script>
