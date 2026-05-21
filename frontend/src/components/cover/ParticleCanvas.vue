<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CoverMode } from '@/stores/cover'
import { createParticleEngine, type ParticleEngineOptions } from '@/utils/particleEngine'

type Props = {
  mode: CoverMode
  reduceMotion: boolean
  particleScale?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'perf-reduced', msg: string): void
  (e: 'perf-restored'): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let engine: ReturnType<typeof createParticleEngine> | null = null

onMounted(() => {
  const el = canvasRef.value
  if (!el) return
  const options: ParticleEngineOptions = {
    mode: props.mode,
    reduceMotion: props.reduceMotion,
    particleScale: props.particleScale,
    onPerfReduced: (msg) => emit('perf-reduced', msg),
    onPerfRestored: () => emit('perf-restored')
  }
  engine = createParticleEngine(el, options)
})

watch(
  () => props.mode,
  (m) => engine?.setMode(m)
)

watch(
  () => props.reduceMotion,
  (v) => engine?.setReduceMotion(v)
)

watch(
  () => props.particleScale,
  (v) => {
    if (typeof v === 'number') engine?.setParticleScale(v)
  }
)

onBeforeUnmount(() => {
  engine?.destroy()
  engine = null
})
</script>

<template>
  <canvas ref="canvasRef" class="pc" />
</template>

<style scoped>
.pc {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

@media (prefers-reduced-motion: reduce) {
  .pc {
    filter: contrast(1.02) saturate(0.95);
  }
}
</style>
