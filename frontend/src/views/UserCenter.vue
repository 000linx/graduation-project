<template>
  <div class="max-w-6xl mx-auto py-12 px-4 flex gap-8">
    <aside class="w-64 space-y-2">
      <div v-for="item in menuItems" :key="item.label" class="px-4 py-3 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer transition-all font-medium text-gray-700">
        {{ item.label }}
      </div>
    </aside>
    <main class="flex-grow bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[500px]">
      <h2 class="text-2xl font-bold mb-8">个人中心</h2>
      <div class="space-y-4">
        <p class="text-gray-600">欢迎来到您的个人中心。</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const menuItems = [
  { label: '我的订单' },
  { label: '收货地址' },
  { label: '我的收藏' },
  { label: '账户安全' },
  { label: '个人资料' }
]
</script>
