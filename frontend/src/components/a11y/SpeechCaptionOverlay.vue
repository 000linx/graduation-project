<script setup lang="ts">
import { computed } from 'vue'
import { useA11yStore } from '../../stores/a11y'
import { useSpeechStore } from '../../stores/speech'

const a11y = useA11yStore()
const speech = useSpeechStore()

const text = computed(() => speech.partial || speech.transcript || '正在聆听…')

function stop() {
  speech.stop()
}
</script>

<template>
  <div
    v-if="a11y.captionsOverlay && a11y.voiceEnabled && speech.listening"
    class="fixed left-1/2 -translate-x-1/2 top-20 z-[9998] w-[min(56rem,calc(100vw-1.5rem))] rounded-2xl border-2 border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="text-sm font-bold text-[var(--c-muted)]">语音输入</div>
        <div class="text-lg font-extrabold text-[var(--c-text)] break-words">
          {{ text }}
        </div>
      </div>
      <button
        type="button"
        class="a11y-hit shrink-0 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] font-extrabold"
        v-feedback
        aria-label="停止语音输入"
        @click="stop"
      >
        停止
      </button>
    </div>
  </div>
</template>
