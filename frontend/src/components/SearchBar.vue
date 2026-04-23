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
      class="w-full pl-12 pr-24 py-3 rounded-2xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] shadow-sm"
      @keyup.enter="handleSearch"
    />
    <Search class="absolute left-4 top-3.5 h-5 w-5 text-[var(--c-muted)]" />
    <button
      @click="handleSearch"
      v-feedback
      class="absolute right-2 top-1.5 a11y-hit bg-[var(--c-primary)] text-[var(--c-on-primary)] px-4 py-2 rounded-xl text-base font-extrabold"
    >
      搜索
    </button>
  </div>
</template>
