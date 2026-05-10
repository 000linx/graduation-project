<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MoreHorizontal, Cpu, Calendar, ShieldCheck, Circle, Wifi, WifiOff, Wrench, Unlink, Eye } from 'lucide-vue-next'
import type { DeviceItem } from '@/stores/device'

const props = defineProps<{ device: DeviceItem; disableActions?: boolean }>()
const emit = defineEmits<{ unbind: [id: string]; reportRepair: [id: string] }>()

const router = useRouter()
const menuOpen = ref(false)
const swipeStartX = ref(0)
const swipeOffset = ref(0)

const statusColor = computed(() => {
  switch (props.device.status) {
    case 'online': return 'var(--c-success, #22c55e)'
    case 'offline': return 'var(--c-muted, #9ca3af)'
    case 'maintenance': return 'var(--c-warning, #f59e0b)'
    default: return 'var(--c-muted, #9ca3af)'
  }
})

const statusLabel = computed(() => {
  switch (props.device.status) {
    case 'online': return '在线'
    case 'offline': return '离线'
    case 'maintenance': return '待维护'
    default: return props.device.status
  }
})

const statusIcon = computed(() => {
  switch (props.device.status) {
    case 'online': return Wifi
    case 'offline': return WifiOff
    case 'maintenance': return Wrench
    default: return Circle
  }
})

function goDetail() {
  router.push(`/device/${props.device._id}`)
}

function onSwipeStart(e: TouchEvent) {
  swipeStartX.value = e.touches[0].clientX
}

function onSwipeMove(e: TouchEvent) {
  const delta = swipeStartX.value - e.touches[0].clientX
  swipeOffset.value = Math.max(0, Math.min(delta, 180))
}

function onSwipeEnd() {
  if (swipeOffset.value > 80) {
    menuOpen.value = true
  }
  swipeOffset.value = 0
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <div
    class="device-card relative overflow-hidden bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl transition-shadow hover:shadow-md"
    role="article"
    :aria-label="`设备: ${device.model}`"
    @touchstart="onSwipeStart"
    @touchmove="onSwipeMove"
    @touchend="onSwipeEnd"
  >
    <div class="flex items-center gap-4 p-4" :style="{ transform: `translateX(-${swipeOffset}px)`, transition: swipeOffset ? 'none' : 'transform 0.2s ease' }">
      <div class="w-16 h-16 rounded-xl bg-[var(--c-bg)] border-2 border-[var(--c-border)] flex items-center justify-center shrink-0 overflow-hidden">
        <img
          v-if="device.thumbnail"
          :src="device.thumbnail"
          :alt="device.model"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <Cpu v-else class="w-8 h-8 icon-tone--muted" />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <div class="text-base font-extrabold text-[var(--c-text)] truncate">{{ device.model }}</div>
          <component :is="statusIcon" class="w-4 h-4 shrink-0" :style="{ color: statusColor }" />
        </div>
        <div class="text-xs font-semibold text-[var(--c-muted)] mt-0.5">
          {{ device.serial_no }}
        </div>
        <div class="flex items-center gap-3 mt-2 text-xs font-semibold">
          <span class="flex items-center gap-1 text-[var(--c-muted)]">
            <Calendar class="w-3.5 h-3.5" />
            {{ device.purchase_date || '未知' }}
          </span>
          <span class="flex items-center gap-1" :style="{ color: statusColor }">
            <ShieldCheck class="w-3.5 h-3.5" />
            {{ device.warranty_end || '--' }}
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border" :style="{ color: statusColor, borderColor: statusColor, background: statusColor + '15' }">
            {{ statusLabel }}
          </span>
        </div>
      </div>

      <button
        v-if="!disableActions"
        type="button"
        class="a11y-hit w-10 h-10 flex items-center justify-center rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-muted)] shrink-0"
        aria-label="更多操作"
        @click="menuOpen = !menuOpen"
      >
        <MoreHorizontal class="w-5 h-5" />
      </button>
    </div>

    <transition name="slide-up">
      <div
        v-if="menuOpen"
        class="absolute bottom-0 left-0 right-0 bg-[var(--c-surface)] border-t-2 border-[var(--c-border)] rounded-b-2xl px-4 py-3 flex items-center gap-3 overflow-x-auto"
        role="menu"
        aria-label="设备操作"
      >
        <button
          v-feedback
          type="button"
          role="menuitem"
          class="a11y-hit flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold text-sm whitespace-nowrap"
          @click="goDetail(); closeMenu()"
        >
          <Eye class="w-4 h-4 icon-tone--info" />
          查看详情
        </button>
        <button
          v-feedback
          type="button"
          role="menuitem"
          class="a11y-hit flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold text-sm whitespace-nowrap"
          @click="emit('reportRepair', device._id); closeMenu()"
        >
          <Wrench class="w-4 h-4 icon-tone--warning" />
          报修
        </button>
        <button
          v-feedback
          type="button"
          role="menuitem"
          class="a11y-hit flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-[var(--c-danger)]/30 bg-[var(--c-danger)]/5 text-[var(--c-danger)] font-extrabold text-sm whitespace-nowrap"
          @click="emit('unbind', device._id); closeMenu()"
        >
          <Unlink class="w-4 h-4" />
          解绑
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.device-card {
  transition: box-shadow 0.2s ease;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
