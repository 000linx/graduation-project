<script setup lang="ts">
defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits(['update:currentPage'])

const changePage = (page: number) => {
  if (page >= 1 && page <= 5) { // Simple mock pagination
    emit('update:currentPage', page)
  }
}
</script>

<template>
  <div class="flex items-center justify-center space-x-2 mt-12">
    <button
      class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
      :disabled="currentPage === 1"
      @click="changePage(currentPage - 1)"
    >
      上一页
    </button>
    
    <button
      v-for="page in 5"
      :key="page"
      @click="changePage(page)"
      :class="[
        'h-10 w-10 rounded-lg text-sm font-medium transition-all',
        currentPage === page
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
      ]"
    >
      {{ page }}
    </button>

    <button
      class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
      :disabled="currentPage === 5"
      @click="changePage(currentPage + 1)"
    >
      下一页
    </button>
  </div>
</template>
