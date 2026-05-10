<script setup lang="ts">
import { BadgeCheck, Headphones, Truck } from 'lucide-vue-next'

type Tile = {
  title: string
  desc: string
  icon: any
  tone: 'info' | 'success' | 'warning' | 'danger' | 'muted'
  to: string
  ariaLabel: string
}

const tiles: Tile[] = [
  {
    title: '服务保障',
    desc: '支持无忧试戴、透明售后与清晰使用说明。',
    icon: BadgeCheck,
    tone: 'success',
    to: '/#support',
    ariaLabel: '查看售后保障与服务说明'
  },
  {
    title: '专业支持',
    desc: '更清晰的佩戴建议与日常维护提示，适老友好。',
    icon: Headphones,
    tone: 'info',
    to: '/recommendations',
    ariaLabel: '查看专业建议与个性化推荐'
  },
  {
    title: '快速配送',
    desc: '发货进度可追踪，包装更易开封与回收。',
    icon: Truck,
    tone: 'info',
    to: '/profile',
    ariaLabel: '查看订单与物流'
  }
]
</script>

<template>
  <section aria-label="导购与信任信息">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <router-link
        v-for="t in tiles"
        :key="t.title"
        :to="t.to"
        v-feedback
        class="no-underline"
        :aria-label="t.ariaLabel"
      >
        <div
          class="h-full bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-5 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-3">
            <div
              class="icon-wrap icon-wrap--duotone h-11 w-11 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center"
            >
              <component :is="t.icon" class="h-5 w-5" :class="`icon-tone--${t.tone}`" aria-hidden="true" />
            </div>
            <div class="text-base font-extrabold text-[var(--c-text)]">{{ t.title }}</div>
          </div>
          <div class="mt-3 text-sm font-semibold text-[var(--c-muted)] leading-relaxed">{{ t.desc }}</div>
        </div>
      </router-link>
    </div>
  </section>
</template>
