<script setup lang="ts">
import { computed } from 'vue'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
const items = computed(() => toast.list)

function toneClass(tone: string) {
  if (tone === 'success') return 'border-emerald-300 bg-emerald-50 text-emerald-900'
  if (tone === 'warning') return 'border-amber-300 bg-amber-50 text-amber-900'
  if (tone === 'error') return 'border-rose-300 bg-rose-50 text-rose-900'
  return 'border-sky-300 bg-sky-50 text-sky-900'
}
</script>

<template>
  <div
    class="fixed top-4 right-4 z-[1000] w-[min(92vw,360px)] space-y-2"
    aria-label="提示"
    aria-live="polite"
  >
    <div
      v-for="t in items"
      :key="t.id"
      class="rounded-2xl border-2 shadow-sm px-4 py-3 flex items-start gap-3"
      :class="toneClass(t.tone)"
      role="status"
    >
      <div class="text-sm font-extrabold leading-snug flex-1 whitespace-pre-line">{{ t.text }}</div>
      <button
        type="button"
        class="h-8 w-8 rounded-xl border-2 border-current/20 font-extrabold"
        aria-label="关闭提示"
        @click="toast.remove(t.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>
