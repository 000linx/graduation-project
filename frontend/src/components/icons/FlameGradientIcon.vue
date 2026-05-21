<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Flame } from 'lucide-vue-next'

const iconRef = ref<any>(null)

function uid() {
  return `flameGrad_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`
}

onMounted(() => {
  const svg = (iconRef.value as any)?.$el as SVGElement | undefined
  if (!svg || svg.getAttribute('data-flame-gradient') === '1') return

  const id = uid()
  const ns = 'http://www.w3.org/2000/svg'

  const defs = document.createElementNS(ns, 'defs')
  const g = document.createElementNS(ns, 'linearGradient')
  g.setAttribute('id', id)
  g.setAttribute('x1', '0')
  g.setAttribute('y1', '0')
  g.setAttribute('x2', '1')
  g.setAttribute('y2', '1')

  const stops: Array<{ o: string; c: string }> = [
    { o: '0%', c: 'var(--icon-flame-0)' },
    { o: '42%', c: 'var(--icon-flame-1)' },
    { o: '72%', c: 'var(--icon-flame-2)' },
    { o: '100%', c: 'var(--icon-flame-3)' }
  ]

  for (const s of stops) {
    const st = document.createElementNS(ns, 'stop')
    st.setAttribute('offset', s.o)
    st.setAttribute('style', `stop-color:${s.c};stop-opacity:1`)
    g.appendChild(st)
  }

  defs.appendChild(g)
  svg.insertBefore(defs, svg.firstChild)

  const nodes = svg.querySelectorAll<SVGElement>('path, circle, rect, polyline, polygon, line')
  nodes.forEach((n) => {
    const stroke = n.getAttribute('stroke')
    if (!stroke || stroke === 'none') return
    n.setAttribute('stroke', `url(#${id})`)
  })

  svg.setAttribute('data-flame-gradient', '1')
})
</script>

<template>
  <Flame ref="iconRef" class="icon-tone--flame" v-bind="$attrs" />
</template>
