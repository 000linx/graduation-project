<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'

type EarThresholds = Record<string, number>
type Thresholds = { left: EarThresholds; right: EarThresholds }

const props = defineProps<{ thresholds: Thresholds; height?: number }>()

const freqs = [250, 500, 1000, 2000, 4000, 8000]
const heightPx = computed(() => Number(props.height || 420))

const chartEl = ref<HTMLElement | null>(null)
let chart: any | null = null
let echartsMod: any | null = null

function freqLabel(f: number) {
  if (f === 1000) return '1k'
  if (f === 2000) return '2k'
  if (f === 4000) return '4k'
  if (f === 8000) return '8k'
  return String(f)
}

const xLabels = computed(() => freqs.map((f) => freqLabel(f)))

const leftSeries = computed(() => freqs.map((f) => Number(props.thresholds?.left?.[String(f)] ?? NaN)))
const rightSeries = computed(() => freqs.map((f) => Number(props.thresholds?.right?.[String(f)] ?? NaN)))

async function ensureChart() {
  if (!chartEl.value) return false
  if (!echartsMod) echartsMod = await import('echarts')
  if (!chart) chart = echartsMod.init(chartEl.value, undefined, { renderer: 'canvas' })
  return true
}

function cssVar(name: string, fallback: string) {
  const vars = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : (null as any)
  return vars?.getPropertyValue(name)?.trim() || fallback
}

async function renderChart() {
  const ok = await ensureChart()
  if (!ok || !chart) return

  const axisText = cssVar('--c-muted', '#9aa4b2')
  const axisLine = cssVar('--c-border', '#203154')
  const gridLine = cssVar('--c-grid', 'rgba(17, 24, 39, 0.15)')
  const leftColor = cssVar('--c-primary', '#00f5ff')
  const rightColor = cssVar('--c-danger', '#ff3b30')
  const surface = cssVar('--c-surface', '#0b1220')

  chart.setOption(
    {
      backgroundColor: surface,
      grid: { left: 52, right: 18, top: 24, bottom: 42 },
      tooltip: {
        trigger: 'axis',
        formatter: (ps: any[]) => {
          const p0 = ps?.[0]
          const idx = p0?.dataIndex ?? 0
          const f = freqs[idx]
          const l = leftSeries.value[idx]
          const r = rightSeries.value[idx]
          const ll = Number.isFinite(l) ? `${l} dB HL` : '-'
          const rr = Number.isFinite(r) ? `${r} dB HL` : '-'
          return `${f} Hz<br/>左耳：${ll}<br/>右耳：${rr}`
        }
      },
      xAxis: {
        type: 'category',
        data: xLabels.value,
        axisLabel: { color: axisText },
        axisLine: { lineStyle: { color: axisLine, opacity: 0.6 } }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 120,
        inverse: true,
        interval: 10,
        axisLabel: { color: axisText, formatter: (v: number) => `${v}` },
        splitLine: { lineStyle: { color: gridLine } },
        axisLine: { show: false }
      },
      series: [
        {
          name: '右耳',
          type: 'line',
          data: rightSeries.value,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 10,
          connectNulls: false,
          lineStyle: { color: rightColor, width: 3 },
          itemStyle: { color: rightColor },
          emphasis: { focus: 'series' }
        },
        {
          name: '左耳',
          type: 'line',
          data: leftSeries.value,
          showSymbol: true,
          symbol: 'path://M-6,-6 L6,6 M6,-6 L-6,6',
          symbolSize: 14,
          connectNulls: false,
          lineStyle: { color: leftColor, width: 3 },
          itemStyle: { color: leftColor },
          emphasis: { focus: 'series' }
        }
      ],
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: axisText },
        data: ['右耳', '左耳']
      }
    },
    { notMerge: true, lazyUpdate: true }
  )
  try {
    chart.resize()
  } catch {}
}

function exportPng() {
  try {
    if (!chart) return null
    return chart.getDataURL({ type: 'png', pixelRatio: 2 })
  } catch {
    return null
  }
}

defineExpose({ exportPng })

useResizeObserver(chartEl, () => {
  try {
    chart?.resize()
  } catch {}
})

onMounted(async () => {
  await nextTick()
  await renderChart()
})

watch(
  () => props.thresholds,
  async () => {
    await nextTick()
    await renderChart()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  try {
    chart?.dispose()
  } catch {}
  chart = null
})
</script>

<template>
  <div class="w-full" :style="{ height: `${heightPx}px` }">
    <div ref="chartEl" class="w-full h-full rounded-2xl border-2 border-[var(--c-border)] overflow-hidden" />
  </div>
</template>
