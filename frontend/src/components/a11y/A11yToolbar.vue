<script setup lang="ts">
import { computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useA11yStore } from '../../stores/a11y'
import { useSpeechStore } from '../../stores/speech'

const a11y = useA11yStore()
const speech = useSpeechStore()
const scalePercent = computed({
  get: () => Number((a11y.fontScale * 100).toFixed(1)),
  set: (v: number) => a11y.setFontScale(Number(v) / 100)
})

function onToggleVoice(v: boolean) {
  a11y.setVoiceEnabled(v)
  if (v) {
    const ok = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!ok) ElMessage.warning('当前浏览器不支持语音输入（Web Speech API）')
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
    ElMessage.warning('当前浏览器不支持语音输入（Web Speech API）')
    return
  }
  if (!a11y.voiceEnabled) a11y.setVoiceEnabled(true)
  if (speech.listening) speech.stop()
  else speech.start('zh-CN')
}
</script>

<template>
  <el-popover placement="bottom-end" trigger="click" :width="a11y.largeTextEnabled ? 360 : 320">
    <template #reference>
      <button
        type="button"
        class="a11y-toolbtn"
        aria-label="无障碍与适老化设置"
        v-feedback
      >
        无障碍
      </button>
    </template>

    <div class="space-y-4">
      <div class="text-base font-bold" style="color: var(--c-text)">无障碍与适老化</div>

      <div class="grid grid-cols-1 gap-3">
        <div class="a11y-row">
          <div class="a11y-row__label">高对比度</div>
          <el-switch data-testid="a11y-hc" :model-value="a11y.highContrast" @change="(v: any) => a11y.setHighContrast(Boolean(v))" />
        </div>

        <div class="a11y-row">
          <div class="a11y-row__label">大字体</div>
          <el-switch data-testid="a11y-large" :model-value="a11y.largeTextEnabled" @change="() => a11y.toggleLargeText()" />
        </div>

        <div class="a11y-row">
          <div class="a11y-row__label">语音输入</div>
          <el-switch data-testid="a11y-voice" :model-value="a11y.voiceEnabled" @change="(v: any) => onToggleVoice(Boolean(v))" />
        </div>

        <div v-if="a11y.voiceEnabled" class="space-y-2">
          <div class="text-sm font-semibold" style="color: var(--c-text)">语音输入控制</div>
          <div class="flex items-center gap-2">
            <el-button type="primary" v-feedback class="a11y-hit" @click="toggleSpeech">
              {{ speech.listening ? '停止语音输入' : '开始语音输入' }}
            </el-button>
            <el-button v-if="speech.hasText" v-feedback class="a11y-hit" @click="speech.reset">清空</el-button>
          </div>
          <div v-if="speech.error" class="text-xs font-bold" style="color: #E02020">{{ speech.error }}</div>
          <div v-else class="text-xs" style="color: var(--c-muted)">
            {{ speech.supported ? (speech.listening ? '正在聆听…可在页面顶部看到字幕叠加' : '点击开始后说出要搜索的关键词') : '当前浏览器不支持 Web Speech API' }}
          </div>
        </div>

        <div class="a11y-row">
          <div class="a11y-row__label">语音播报</div>
          <el-switch data-testid="a11y-tts" :model-value="a11y.ttsEnabled" @change="(v: any) => a11y.setTtsEnabled(Boolean(v))" />
        </div>

        <div class="a11y-row">
          <div class="a11y-row__label">字幕叠加</div>
          <el-switch data-testid="a11y-captions" :model-value="a11y.captionsOverlay" @change="(v: any) => a11y.setCaptionsOverlay(Boolean(v))" />
        </div>
      </div>

      <div class="space-y-2">
        <div class="text-sm font-semibold" style="color: var(--c-text)">字号（100% - 200%）</div>
        <el-slider v-model="scalePercent" :min="100" :max="200" :step="12.5" />
        <div class="text-sm" style="color: var(--c-muted)">{{ scalePercent }}%</div>
      </div>

      <div class="space-y-2">
        <div class="text-sm font-semibold" style="color: var(--c-text)">交互反馈</div>
        <el-radio-group
          v-model="a11y.interactionFeedback"
          @change="(v: any) => a11y.setInteractionFeedback(v)"
          class="a11y-radio"
        >
          <el-radio-button label="focus">高亮</el-radio-button>
          <el-radio-button label="haptic">震动</el-radio-button>
          <el-radio-button label="sound">音效</el-radio-button>
        </el-radio-group>
      </div>
    </div>
  </el-popover>
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

.a11y-radio :deep(.el-radio-button__inner) {
  min-height: 3rem;
  display: inline-flex;
  align-items: center;
}
</style>
