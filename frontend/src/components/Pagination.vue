<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits(['update:currentPage'])

const changePage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page)
  }
}
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center space-x-2 mt-12">
    <button
      class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
      :disabled="currentPage === 1"
      @click="changePage(currentPage - 1)"
    >
      上一页
    </button>
    
    <button
      v-for="page in totalPages"
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
      :disabled="currentPage === totalPages"
      @click="changePage(currentPage + 1)"
    >
      下一页
    </button>
  </div>
</template>
