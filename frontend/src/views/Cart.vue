<template>
  <div class="max-w-4xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold mb-8">您的购物车</h1>
    <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
      <div class="text-gray-400 mb-6">
        <shopping-cart class="h-16 w-16 mx-auto" />
      </div>
      <p class="text-xl font-medium text-gray-900 mb-2">购物车还是空的</p>
      <p class="text-gray-500 mb-8">赶紧去选购您心仪的助听器吧！</p>
      <router-link to="/" class="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all">
        去逛逛
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next'
</script>
