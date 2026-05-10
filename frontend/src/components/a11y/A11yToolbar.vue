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
    const ok =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!ok) notify('当前浏览器不支持语音输入（Web Speech API）', { tone: 'warning', flash: true })
  } else {
    speech.stop()
    speech.reset()
  }
}

function setTheme(v: 'system' | 'light' | 'dark') {
  a11y.setThemeMode(v)
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
      :aria-label="$t('a11y.panel')"
      v-feedback
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ $t('a11y.title') }}
    </button>
    <div
      v-if="open"
      class="absolute right-0 mt-3 z-50 rounded-2xl border-2 border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-lg"
      :style="{ width: a11y.largeTextEnabled ? '360px' : '320px' }"
      role="dialog"
      :aria-label="$t('a11y.panel')"
    >
      <div class="space-y-4">
        <div class="text-base font-bold" style="color: var(--c-text)">{{ $t('a11y.title') }}</div>

        <div class="grid grid-cols-1 gap-3">
          <div class="a11y-row">
            <div class="a11y-row__label">{{ $t('a11y.theme') }}</div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="a11y-hit px-3 rounded-xl border-2 border-[var(--c-border)] font-extrabold"
                :class="
                  a11y.themeMode === 'system'
                    ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)]'
                    : 'bg-[var(--c-bg)] text-[var(--c-text)]'
                "
                @click="setTheme('system')"
                :aria-label="$t('a11y.themeSystem')"
              >
                {{ $t('a11y.themeSystem') }}
              </button>
              <button
                type="button"
                class="a11y-hit px-3 rounded-xl border-2 border-[var(--c-border)] font-extrabold"
                :class="
                  a11y.themeMode === 'light'
                    ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)]'
                    : 'bg-[var(--c-bg)] text-[var(--c-text)]'
                "
                @click="setTheme('light')"
                :aria-label="$t('a11y.themeLight')"
              >
                {{ $t('a11y.themeLight') }}
              </button>
              <button
                type="button"
                class="a11y-hit px-3 rounded-xl border-2 border-[var(--c-border)] font-extrabold"
                :class="
                  a11y.themeMode === 'dark'
                    ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)]'
                    : 'bg-[var(--c-bg)] text-[var(--c-text)]'
                "
                @click="setTheme('dark')"
                :aria-label="$t('a11y.themeDark')"
              >
                {{ $t('a11y.themeDark') }}
              </button>
            </div>
          </div>

          <div class="a11y-row">
            <div class="a11y-row__label">{{ $t('a11y.highContrast') }}</div>
            <input
              data-testid="a11y-hc"
              type="checkbox"
              class="a11y-switch"
              :checked="a11y.highContrast"
              @change="(e: any) => a11y.setHighContrast(Boolean(e.target?.checked))"
            />
          </div>

          <div class="a11y-row">
            <div class="a11y-row__label">{{ $t('a11y.largeText') }}</div>
            <input
              data-testid="a11y-large"
              type="checkbox"
              class="a11y-switch"
              :checked="a11y.largeTextEnabled"
              @click.prevent="a11y.toggleLargeText()"
            />
          </div>

          <div class="a11y-row">
            <div class="a11y-row__label">{{ $t('a11y.voiceInput') }}</div>
            <input
              data-testid="a11y-voice"
              type="checkbox"
              class="a11y-switch"
              :checked="a11y.voiceEnabled"
              @change="(e: any) => onToggleVoice(Boolean(e.target?.checked))"
            />
          </div>

          <div v-if="a11y.voiceEnabled" class="space-y-2">
            <div class="text-sm font-semibold" style="color: var(--c-text)">{{ $t('a11y.voiceCtrl') }}</div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                v-feedback
                class="a11y-hit px-4 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-primary)] text-[var(--c-on-primary)] font-extrabold"
                @click="toggleSpeech"
              >
                {{ speech.listening ? $t('a11y.voiceStop') : $t('a11y.voiceStart') }}
              </button>
              <button
                v-if="speech.hasText"
                type="button"
                v-feedback
                class="a11y-hit px-4 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold"
                @click="speech.reset"
              >
                {{ $t('a11y.clear') }}
              </button>
            </div>
            <div v-if="speech.error" class="text-xs font-bold" style="color: #e02020">{{ speech.error }}</div>
            <div v-else class="text-xs" style="color: var(--c-muted)">
              {{
                speech.supported
                  ? speech.listening
                    ? '正在聆听…可在页面顶部看到字幕叠加'
                    : '点击开始后说出要搜索的关键词'
                  : '当前浏览器不支持 Web Speech API'
              }}
            </div>
          </div>

          <div class="a11y-row">
            <div class="a11y-row__label">{{ $t('a11y.tts') }}</div>
            <input
              data-testid="a11y-tts"
              type="checkbox"
              class="a11y-switch"
              :checked="a11y.ttsEnabled"
              @change="(e: any) => a11y.setTtsEnabled(Boolean(e.target?.checked))"
            />
          </div>

          <div class="a11y-row">
            <div class="a11y-row__label">{{ $t('a11y.captions') }}</div>
            <input
              data-testid="a11y-captions"
              type="checkbox"
              class="a11y-switch"
              :checked="a11y.captionsOverlay"
              @change="(e: any) => a11y.setCaptionsOverlay(Boolean(e.target?.checked))"
            />
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-semibold" style="color: var(--c-text)">{{ $t('a11y.fontSize') }}</div>
          <input
            v-model="scalePercent"
            type="range"
            min="100"
            max="200"
            step="12.5"
            class="w-full"
            aria-label="字号"
          />
          <div class="text-sm" style="color: var(--c-muted)">{{ scalePercent }}%</div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-semibold" style="color: var(--c-text)">{{ $t('a11y.feedback') }}</div>
          <div class="flex flex-nowrap gap-2 overflow-x-auto">
            <button
              type="button"
              class="a11y-hit px-3 rounded-xl border-2 border-[var(--c-border)] font-extrabold"
              :class="
                a11y.interactionFeedback === 'focus'
                  ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)]'
                  : 'bg-[var(--c-bg)] text-[var(--c-text)]'
              "
              @click="a11y.setInteractionFeedback('focus')"
            >
              {{ $t('a11y.feedbackFocus') }}
            </button>
            <button
              type="button"
              class="a11y-hit px-3 rounded-xl border-2 border-[var(--c-border)] font-extrabold"
              :class="
                a11y.interactionFeedback === 'haptic'
                  ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)]'
                  : 'bg-[var(--c-bg)] text-[var(--c-text)]'
              "
              @click="a11y.setInteractionFeedback('haptic')"
            >
              {{ $t('a11y.feedbackHaptic') }}
            </button>
            <button
              type="button"
              class="a11y-hit px-3 rounded-xl border-2 border-[var(--c-border)] font-extrabold"
              :class="
                a11y.interactionFeedback === 'sound'
                  ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)]'
                  : 'bg-[var(--c-bg)] text-[var(--c-text)]'
              "
              @click="a11y.setInteractionFeedback('sound')"
            >
              {{ $t('a11y.feedbackSound') }}
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
