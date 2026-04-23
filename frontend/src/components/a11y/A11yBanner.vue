<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useAnnouncerStore } from '../../stores/announcer'

const announcer = useAnnouncerStore()
const visible = ref(false)
const progressKey = ref(0)
let timer: number | null = null

const toneClass = computed(() => {
  if (announcer.tone === 'success') return 'a11y-banner--success'
  if (announcer.tone === 'warning') return 'a11y-banner--warning'
  if (announcer.tone === 'error') return 'a11y-banner--error'
  return 'a11y-banner--info'
})

function clearTimer() {
  if (timer) window.clearTimeout(timer)
  timer = null
}

watch(
  () => announcer.seq,
  () => {
    clearTimer()
    if (!announcer.text) {
      visible.value = false
      return
    }
    visible.value = true
    progressKey.value += 1
    timer = window.setTimeout(() => {
      visible.value = false
    }, announcer.ttlMs)
  }
)

onBeforeUnmount(clearTimer)
</script>

<template>
  <div v-if="visible" class="a11y-banner" :class="[toneClass, announcer.flash ? 'a11y-banner--flash' : '']">
    <div class="a11y-banner__inner">
      <div class="a11y-banner__text">{{ announcer.text }}</div>
      <button class="a11y-banner__close" type="button" aria-label="关闭提示" v-feedback @click="visible = false">关闭</button>
    </div>
    <div class="a11y-banner__progress" :key="progressKey" :style="{ animationDuration: announcer.ttlMs + 'ms' }" />
  </div>
</template>

<style scoped>
.a11y-banner {
  position: fixed;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(56rem, calc(100vw - 1.5rem));
  border: 2px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-text);
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
}

.a11y-banner__inner {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0.75rem;
}

.a11y-banner__text {
  font-size: 1.125rem;
  line-height: 1.4;
}

.a11y-banner__close {
  min-width: 3rem;
  min-height: 3rem;
  padding: 0 0.75rem;
  border-radius: 0.75rem;
  border: 2px solid var(--c-border);
  background: transparent;
  color: inherit;
  font-weight: 700;
}

.a11y-banner__close:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}

.a11y-banner__progress {
  height: 0.375rem;
  background: var(--c-primary);
  animation-name: a11yProgress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.a11y-banner--info {
  border-color: var(--c-border);
}

.a11y-banner--success {
  border-color: var(--c-success);
}

.a11y-banner--warning {
  border-color: var(--c-warning);
}

.a11y-banner--error {
  border-color: var(--c-danger);
}

@keyframes a11yProgress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .a11y-banner--flash {
    animation: a11yFlash 0.9s ease-in-out 0s 2;
  }
  @keyframes a11yFlash {
    0% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.35);
    }
    100% {
      filter: brightness(1);
    }
  }
}
</style>

