<script setup lang="ts">
import { computed } from 'vue'
import { useTransitionStore } from '@/stores/transition'

const t = useTransitionStore()

const cls = computed(() => {
  if (!t.active) return ''
  return t.style === 'to-cover' ? 'overlay overlay--cover' : 'overlay overlay--home'
})
</script>

<template>
  <div v-if="t.active" :class="cls" aria-hidden="true">
    <div class="overlay__veil" />
    <div class="overlay__shine" />
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
}

.overlay__veil {
  position: absolute;
  inset: 0;
  background: radial-gradient(1200px 800px at 50% 40%, rgb(91 140 255 / 22%), rgb(7 10 18 / 92%));
  animation: veil 720ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.overlay__shine {
  position: absolute;
  inset: -20%;
  background: radial-gradient(700px 260px at 50% 40%, rgb(0 245 255 / 18%), transparent 70%);
  filter: blur(18px);
  opacity: 0;
  animation: shine 720ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.overlay--cover .overlay__veil {
  background: radial-gradient(1100px 760px at 50% 40%, rgb(0 245 255 / 18%), rgb(7 10 18 / 92%));
}

@keyframes veil {
  0% {
    opacity: 0;
    transform: scale(1.01);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }

  100% {
    opacity: 0;
    transform: scale(0.995);
  }
}

@keyframes shine {
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }

  45% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateY(-10px) scale(1.02);
  }
}

@media (prefers-reduced-motion: reduce) {
  .overlay__veil,
  .overlay__shine {
    animation: none;
    opacity: 0.92;
  }
}
</style>
