<script setup lang="ts">
import { ref } from 'vue'
import { ShoppingCart, User, Search } from 'lucide-vue-next'

const searchQuery = ref('')
const handleSearch = () => {
  console.log('Searching for:', searchQuery.value)
}
</script>

<template>
  <header class="bg-white shadow-sm sticky top-0 z-50">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center space-x-2">
        <span class="text-2xl font-bold text-blue-600 tracking-tight">助听器商城</span>
      </router-link>

      <!-- Search Bar -->
      <div class="hidden md:flex flex-grow max-w-md mx-8">
        <div class="relative w-full">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索助听器型号、品牌..."
            class="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @keyup.enter="handleSearch"
          />
          <Search class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <!-- Navigation Actions -->
      <div class="flex items-center space-x-6">
        <router-link to="/cart" class="relative text-gray-600 hover:text-blue-600 transition-colors">
          <ShoppingCart class="h-6 w-6" />
          <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
        </router-link>
        
        <router-link to="/profile" class="text-gray-600 hover:text-blue-600 transition-colors">
          <User class="h-6 w-6" />
        </router-link>
        
        <router-link to="/admin" class="hidden md:block text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
          管理后台
        </router-link>
      </div>
    </div>
  </header>
</template>
