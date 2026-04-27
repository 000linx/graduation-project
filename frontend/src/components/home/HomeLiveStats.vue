<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Clock, Flame, Users } from 'lucide-vue-next'

const props = defineProps<{
  productCount: number
}>()

const activeUsers = ref(0)
const todayOrders = ref(0)
const countdown = ref('')
let timer: number | null = null

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hh = String(Math.floor(total / 3600)).padStart(2, '0')
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const baseOrders = computed(() => Math.max(8, Math.min(88, Math.floor(props.productCount * 3))))

onMounted(() => {
  const now = Date.now()
  const end = new Date().setHours(23, 59, 59, 999)
  activeUsers.value = 120 + Math.floor(Math.random() * 80)
  todayOrders.value = baseOrders.value + Math.floor(Math.random() * 15)
  countdown.value = formatCountdown(end - now)

  timer = window.setInterval(() => {
    const t = Date.now()
    countdown.value = formatCountdown(end - t)

    if (Math.random() < 0.35) activeUsers.value = Math.max(80, activeUsers.value + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3)))
    if (Math.random() < 0.18) todayOrders.value = Math.max(baseOrders.value, todayOrders.value + 1)
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  timer = null
})
</script>

<template>
  <section
    class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl px-4 py-3"
    aria-label="实时数据"
  >
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" role="status" aria-live="polite">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center">
          <Users class="h-5 w-5 text-[var(--c-text)]" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold text-[var(--c-muted)]">当前活跃</div>
          <div class="text-base font-extrabold text-[var(--c-text)] truncate">{{ activeUsers }} 人</div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center">
          <Flame class="h-5 w-5 text-[var(--c-text)]" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold text-[var(--c-muted)]">今日下单</div>
          <div class="text-base font-extrabold text-[var(--c-text)] truncate">{{ todayOrders }} 单</div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center">
          <Clock class="h-5 w-5 text-[var(--c-text)]" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold text-[var(--c-muted)]">限时活动倒计时</div>
          <div class="text-base font-extrabold text-[var(--c-text)] truncate">{{ countdown }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

