<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next'

defineProps<{
  product: {
    id: string
    name: string
    price: number
    image: string
    category: string
    rating: number
  }
}>()
</script>

<template>
  <div class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
    <!-- Image Container -->
    <div class="relative aspect-square overflow-hidden bg-gray-50">
      <router-link :to="`/product/${product.id}`" class="block">
        <img
          :src="product.image"
          :alt="product.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </router-link>
      <div class="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-medium text-blue-600">
        {{ product.category }}
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <router-link :to="`/product/${product.id}`">
        <h3 class="font-semibold text-gray-900 line-clamp-2 min-h-[3rem] mb-2 group-hover:text-blue-600 transition-colors">
          {{ product.name }}
        </h3>
      </router-link>
      
      <div class="flex items-center justify-between mt-auto">
        <div class="flex flex-col">
          <span class="text-xs text-gray-500">价格</span>
          <span class="text-xl font-bold text-red-600">¥{{ product.price }}</span>
        </div>
        
        <button
          class="p-2.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
          title="加入购物车"
        >
          <ShoppingCart class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>
