<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Sparkles } from 'lucide-vue-next'
import ParticleCanvas from '@/components/cover/ParticleCanvas.vue'
import { useCoverStore } from '@/stores/cover'
import { useTransitionStore } from '@/stores/transition'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const cover = useCoverStore()
const transition = useTransitionStore()
const { t } = useI18n()

const entering = ref(false)

const redirectTo = computed(() => {
  const q = route.query.redirect
  return typeof q === 'string' && q.length > 0 ? q : '/'
})

const modeHint = computed(() => '专业听力技术与适老设计，帮助你更轻松地参与交流')
const particleDebug = computed(() => typeof window !== 'undefined' && /(^|[?&])particleDebug=1(&|$)/.test(window.location.search))

function onParticleScaleInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  cover.setParticleScale(v)
}

function onHoverEnter() {
  if (cover.mode !== 'gather') cover.setMode('gather')
}

function onHoverLeave() {
  if (cover.mode === 'gather') cover.setMode('follow')
}

async function enter() {
  if (entering.value) return
  entering.value = true
  cover.markSeen()
  await transition.run(
    'to-home',
    () => router.replace(redirectTo.value),
    cover.reduceMotion ? { inMs: 80, outMs: 180 } : { inMs: 220, outMs: 520 }
  )
  entering.value = false
}

onMounted(() => {
  cover.init()
})
</script>

<template>
  <div class="cover" aria-label="商城封面">
    <ParticleCanvas
      class="cover__canvas"
      :mode="cover.mode"
      :reduce-motion="cover.reduceMotion"
      :particle-scale="cover.particleScale"
      @perf-reduced="(msg) => cover.setPerfReduced(true, msg)"
      @perf-restored="() => cover.setPerfReduced(false, null)"
    />

    <div class="cover__content">
      <div class="cover__top">
        <div class="cover__brand" aria-label="品牌">
          <div class="cover__logo">
            <Sparkles class="h-5 w-5 icon-tone--info" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <div class="cover__title">{{ t('app.name') }}</div>
            <div class="cover__subtitle">可交互粒子封面 · 跟随 / 散开 / 聚合</div>
          </div>
        </div>
      </div>

      <div class="cover__center" role="region" aria-label="封面交互区" @pointerenter="onHoverEnter" @pointerleave="onHoverLeave">
        <div class="cover__headline">重回听的世界</div>
        <div class="cover__hint">{{ modeHint }}</div>

        <div class="cover__actions">
          <button
            type="button"
            class="cover__cta"
            :disabled="entering"
            aria-label="进入商城"
            @click="enter"
          >
            进入商城
            <ArrowRight class="h-4 w-4 icon-tone--info" aria-hidden="true" />
          </button>
        </div>

        <div v-if="particleDebug" class="cover__debug" role="group" aria-label="粒子调试面板">
          <div class="cover__debugRow">
            <div class="cover__debugLabel">粒子尺寸</div>
            <input
              class="cover__debugRange"
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              :value="cover.particleScale"
              @input="onParticleScaleInput"
            />
            <div class="cover__debugValue">{{ cover.particleScale.toFixed(1) }}×</div>
          </div>
          <div class="cover__debugHint">开启调试：?particleDebug=1（同时显示椭圆边界与 FPS 日志）</div>
        </div>

        <div v-if="cover.perfReduced && cover.perfMessage" class="cover__perf" role="status" aria-live="polite">
          {{ cover.perfMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cover {
  position: relative;
  min-height: 100vh;
  background: #070a12;
  overflow: hidden;
}

.cover__canvas {
  position: fixed;
  inset: 0;
}

.cover__content {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.cover__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
}

.cover__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.cover__logo {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.16);
  background: rgba(11, 16, 32, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 245, 255, 0.9);
}

.cover__title {
  font-weight: 900;
  font-size: 18px;
  color: #fff;
  letter-spacing: 0.2px;
}

.cover__subtitle {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(184, 192, 204, 0.92);
}

.cover__center {
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}

.cover__headline {
  font-size: 40px;
  line-height: 1.05;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
}

.cover__hint {
  font-size: 14px;
  font-weight: 700;
  color: rgba(184, 192, 204, 0.96);
  max-width: 680px;
}

.cover__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 6px;
}

.cover__cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
  border: 2px solid rgba(91, 140, 255, 0.55);
  background: rgba(91, 140, 255, 0.92);
  color: #fff;
  padding: 12px 16px;
  font-weight: 900;
  transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.cover__cta:disabled {
  opacity: 0.6;
}

.cover__perf {
  margin-top: 10px;
  display: inline-flex;
  align-self: flex-start;
  border-radius: 14px;
  border: 2px solid rgba(255, 209, 102, 0.35);
  background: rgba(20, 18, 12, 0.6);
  color: rgba(255, 209, 102, 0.96);
  padding: 10px 12px;
  font-weight: 900;
  font-size: 12px;
}

.cover__debug {
  margin-top: 10px;
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  background: rgba(11, 16, 32, 0.55);
  padding: 12px 12px;
  color: rgba(255, 255, 255, 0.92);
}

.cover__debugRow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cover__debugLabel {
  font-size: 12px;
  font-weight: 900;
  color: rgba(184, 192, 204, 0.96);
  width: 64px;
}

.cover__debugRange {
  flex: 1;
}

.cover__debugValue {
  width: 52px;
  text-align: right;
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
}

.cover__debugHint {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(184, 192, 204, 0.96);
}

@media (max-width: 768px) {
  .cover__headline {
    font-size: 34px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover__cta {
    transition: none;
  }
}
</style>

