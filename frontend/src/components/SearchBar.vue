<script setup lang="ts">
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'

const searchQuery = ref('')
const emit = defineEmits(['search'])

const handleSearch = () => {
  emit('search', searchQuery.value)
}
</script>

<template>
  <div class="relative w-full max-w-xl">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="输入关键词搜索助听器..."
      class="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
      @keyup.enter="handleSearch"
    />
    <Search class="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
    <button
      @click="handleSearch"
      class="absolute right-2 top-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      搜索
    </button>
  </div>
</template>
