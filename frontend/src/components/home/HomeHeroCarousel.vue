<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

type Slide = {
  title: string
  subtitle: string
  image: string
  ctaText: string
  to: string
}

const props = defineProps<{
  slides: Slide[]
}>()

const reducedMotion = ref(false)
const activeIndex = ref(0)
let timer: number | null = null

onMounted(() => {
  try {
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    reducedMotion.value = false
  }
})

const autoplay = computed(() => !reducedMotion.value)

function next() {
  const n = props.slides.length || 1
  activeIndex.value = (activeIndex.value + 1) % n
}

function prev() {
  const n = props.slides.length || 1
  activeIndex.value = (activeIndex.value - 1 + n) % n
}

function startAutoplay() {
  stopAutoplay()
  if (!autoplay.value) return
  timer = window.setInterval(() => next(), 6500)
}

function stopAutoplay() {
  if (timer) window.clearInterval(timer)
  timer = null
}

watch(
  () => autoplay.value,
  () => startAutoplay()
)

onMounted(() => startAutoplay())
onUnmounted(() => stopAutoplay())
</script>

<template>
  <section
    id="campaign"
    class="relative rounded-3xl overflow-hidden bg-[var(--c-primary)] border-2 border-[var(--c-border)]"
    aria-label="主视觉轮播"
  >
    <div class="relative h-[400px] home-hero-carousel">
      <div
        v-for="(s, idx) in props.slides"
        :key="idx"
        class="absolute inset-0 transition-opacity duration-500"
        :class="idx === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'"
        aria-live="polite"
      >
        <div class="relative h-full w-full flex items-center">
          <img
            :src="s.image"
            :alt="s.title"
            width="1600"
            height="900"
            class="absolute inset-0 w-full h-full object-cover opacity-25"
            decoding="async"
            :fetchpriority="idx === 0 ? 'high' : 'low'"
            :loading="idx === 0 ? 'eager' : 'lazy'"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-black/0" aria-hidden="true" />

          <div class="relative container mx-auto px-6 lg:px-12 text-[var(--c-on-primary)] space-y-5">
            <h1 class="text-4xl lg:text-5xl font-extrabold leading-tight whitespace-pre-line">{{ s.title }}</h1>
            <p class="text-base lg:text-xl opacity-95 max-w-xl">{{ s.subtitle }}</p>
            <router-link
              :to="s.to"
              v-feedback
              class="a11y-hit bg-[var(--c-on-primary)] text-[var(--c-primary)] px-8 py-3 rounded-full font-extrabold flex items-center gap-2 w-fit no-underline"
              :aria-label="s.ctaText"
            >
              <span>{{ s.ctaText }}</span>
              <ChevronRight class="h-5 w-5" aria-hidden="true" />
            </router-link>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 text-white border-2 border-[var(--c-border)] flex items-center justify-center"
        aria-label="上一张"
        @click="prev"
      >
        <ChevronLeft class="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 text-white border-2 border-[var(--c-border)] flex items-center justify-center"
        aria-label="下一张"
        @click="next"
      >
        <ChevronRight class="h-5 w-5" aria-hidden="true" />
      </button>

      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" aria-label="轮播指示器">
        <button
          v-for="(s, idx) in props.slides"
          :key="`dot-${idx}`"
          type="button"
          class="h-3 w-3 rounded-full border-2 border-[var(--c-border)]"
          :class="idx === activeIndex ? 'bg-white/90' : 'bg-white/20'"
          :aria-label="`切换到第 ${idx + 1} 张：${s.title}`"
          @click="activeIndex = idx"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
@media (max-width: 640px) {
  .home-hero-carousel {
    height: 360px;
  }
}
</style>
