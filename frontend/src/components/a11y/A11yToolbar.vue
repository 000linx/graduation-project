<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useA11yStore } from '../../stores/a11y'
import { useSpeechStore } from '../../stores/speech'
import { notify } from '../../utils/notify'

const a11y = useA11yStore()
const speech = useSpeechStore()
const open = ref(false)
const popRef = ref<HTMLElement | null>(null)
const scalePercent = computed({
  get: () => Number((a11y.fontScale * 100).toFixed(1)),
  set: (v: number) => a11y.setFontScale(Number(v) / 100)
})

function onToggleVoice(v: boolean) {
  a11y.setVoiceEnabled(v)
  if (v) {
    const ok = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!ok) notify('当前浏览器不支持语音输入（Web Speech API）', { tone: 'warning', flash: true })
  } else {
    speech.stop()
    speech.reset()
  }
}

watch(
  () => a11y.voiceEnabled,
  (v) => {
    if (!v) {
      speech.stop()
      speech.reset()
    }
  }
)

function toggleSpeech() {
  if (!speech.supported) {
    notify('当前浏览器不支持语音输入（Web Speech API）', { tone: 'warning', flash: true })
    return
  }
  if (!a11y.voiceEnabled) a11y.setVoiceEnabled(true)
  if (speech.listening) speech.stop()
  else speech.start('zh-CN')
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value) return
  const el = popRef.value
  if (!el) return
  const t = e.target as Node | null
  if (t && el.contains(t)) return
  open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
})
</script>

<template>
  <div class="relative" ref="popRef">
      <button
        type="button"
        class="a11y-toolbtn"
        aria-label="无障碍与适老化设置"
        v-feedback
        :aria-expanded="open"
        @click="open = !open"
      >
        无障碍
      </button>
    <div
      v-if="open"
      class="absolute right-0 mt-3 z-50 rounded-2xl border-2 border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-lg"
      :style="{ width: a11y.largeTextEnabled ? '360px' : '320px' }"
      role="dialog"
      aria-label="无障碍与适老化设置面板"
    >
      <div class="space-y-4">
      <div class="text-base font-bold" style="color: var(--c-text)">无障碍与适老化</div>

      <div class="grid grid-cols-1 gap-3">
        <div class="a11y-row">
          <div class="a11y-row__label">高对比度</div>
          <input data-testid="a11y-hc" type="checkbox" class="a11y-switch" :checked="a11y.highContrast" @change="(e: any) => a11y.setHighContrast(Boolean(e.target?.checked))" />
        </div>

        <div class="a11y-row">
          <div class="a11y-row__label">大字体</div>
          <input data-testid="a11y-large" type="checkbox" class="a11y-switch" :checked="a11y.largeTextEnabled" @change="() => a11y.toggleLargeText()" />
        </div>

        <div class="a11y-row">
          <div class="a11y-row__label">语音输入</div>
          <input data-testid="a11y-voice" type="checkbox" class="a11y-switch" :checked="a11y.voiceEnabled" @change="(e: any) => onToggleVoice(Boolean(e.target?.checked))" />
        </div>

        <div v-if="a11y.voiceEnabled" class="space-y-2">
          <div class="text-sm font-semibold" style="color: var(--c-text)">语音输入控制</div>
          <div class="flex items-center gap-2">
            <button type="button" v-feedback class="a11y-hit px-4 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-primary)] text-[var(--c-on-primary)] font-extrabold" @click="toggleSpeech">
              {{ speech.listening ? '停止语音输入' : '开始语音输入' }}
            </button>
            <button v-if="speech.hasText" type="button" v-feedback class="a11y-hit px-4 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold" @click="speech.reset">清空</button>
          </div>
          <div v-if="speech.error" class="text-xs font-bold" style="color: #E02020">{{ speech.error }}</div>
          <div v-else class="text-xs" style="color: var(--c-muted)">
            {{ speech.supported ? (speech.listening ? '正在聆听…可在页面顶部看到字幕叠加' : '点击开始后说出要搜索的关键词') : '当前浏览器不支持 Web Speech API' }}
          </div>
        </div>

        <div class="a11y-row">
          <div class="a11y-row__label">语音播报</div>
          <input data-testid="a11y-tts" type="checkbox" class="a11y-switch" :checked="a11y.ttsEnabled" @change="(e: any) => a11y.setTtsEnabled(Boolean(e.target?.checked))" />
        </div>

        <div class="a11y-row">
          <div class="a11y-row__label">字幕叠加</div>
          <input data-testid="a11y-captions" type="checkbox" class="a11y-switch" :checked="a11y.captionsOverlay" @change="(e: any) => a11y.setCaptionsOverlay(Boolean(e.target?.checked))" />
        </div>
      </div>

      <div class="space-y-2">
        <div class="text-sm font-semibold" style="color: var(--c-text)">字号（100% - 200%）</div>
        <input v-model="scalePercent" type="range" min="100" max="200" step="12.5" class="w-full" aria-label="字号" />
        <div class="text-sm" style="color: var(--c-muted)">{{ scalePercent }}%</div>
      </div>

      <div class="space-y-2">
        <div class="text-sm font-semibold" style="color: var(--c-text)">交互反馈</div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="a11y-hit px-3 rounded-xl border-2 border-[var(--c-border)] font-extrabold"
            :class="a11y.interactionFeedback === 'focus' ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)]' : 'bg-[var(--c-bg)] text-[var(--c-text)]'"
            @click="a11y.setInteractionFeedback('focus')"
          >
            高亮
          </button>
          <button
            type="button"
            class="a11y-hit px-3 rounded-xl border-2 border-[var(--c-border)] font-extrabold"
            :class="a11y.interactionFeedback === 'haptic' ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)]' : 'bg-[var(--c-bg)] text-[var(--c-text)]'"
            @click="a11y.setInteractionFeedback('haptic')"
          >
            震动
          </button>
          <button
            type="button"
            class="a11y-hit px-3 rounded-xl border-2 border-[var(--c-border)] font-extrabold"
            :class="a11y.interactionFeedback === 'sound' ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)]' : 'bg-[var(--c-bg)] text-[var(--c-text)]'"
            @click="a11y.setInteractionFeedback('sound')"
          >
            音效
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.a11y-toolbtn {
  min-width: 3rem;
  min-height: 3rem;
  padding: 0 0.9rem;
  border-radius: 9999px;
  border: 2px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-text);
  font-weight: 800;
  letter-spacing: 0.02em;
}

.a11y-toolbtn:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}

.a11y-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3rem;
}

.a11y-row__label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--c-text);
}

.a11y-switch {
  width: 3.25rem;
  height: 1.75rem;
  accent-color: var(--c-primary);
}
</style>
