<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  desc: string
  to: string
  badge: string
}>()
</script>

<template>
  <router-link :to="props.to" v-feedback class="block no-underline" :aria-label="props.title">
    <div
      class="h-full bg-[var(--c-surface)] rounded-xl overflow-hidden shadow-sm border-2 border-[var(--c-border)] p-4 hover:shadow-md transition-shadow"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-xs font-extrabold text-[var(--c-muted)]">{{ props.badge }}</div>
          <div class="mt-1 text-base font-extrabold text-[var(--c-text)]">{{ props.title }}</div>
          <div class="mt-2 text-sm font-semibold text-[var(--c-muted)] leading-relaxed">{{ props.desc }}</div>
        </div>
        <div
          class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center shrink-0"
        >
          <ArrowRight class="h-5 w-5 icon-tone--info" aria-hidden="true" />
        </div>
      </div>
    </div>
  </router-link>
</template>
