type PerfReport = {
  lcpMs?: number
  cls?: number
  firstInputDelayMs?: number
  domContentLoadedMs?: number
  loadMs?: number
}

function toNumber(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export function maybeStartPerfMonitor() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (!params.has('perf')) return

  const report: PerfReport = {}

  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (nav) {
    report.domContentLoadedMs = toNumber(nav.domContentLoadedEventEnd)
    report.loadMs = toNumber(nav.loadEventEnd)
  }

  try {
    let cls = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const e of list.getEntries() as any[]) {
        if (!e?.hadRecentInput) cls += Number(e?.value ?? 0)
      }
      report.cls = Number(cls.toFixed(4))
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true as any })
  } catch {
  }

  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[]
      const last = entries[entries.length - 1]
      const start = Number(last?.startTime ?? 0)
      if (start > 0) report.lcpMs = Math.round(start)
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true as any })
  } catch {
  }

  try {
    const onFirstInput = (e: Event) => {
      const ts = (e as any).timeStamp
      const delay = typeof ts === 'number' ? performance.now() - ts : undefined
      if (typeof delay === 'number' && Number.isFinite(delay)) report.firstInputDelayMs = Math.max(0, Math.round(delay))
    }
    window.addEventListener('pointerdown', onFirstInput, { once: true, passive: true })
    window.addEventListener('keydown', onFirstInput, { once: true, passive: true })
  } catch {
  }

  const emit = () => {
    const snapshot = {
      lcpMs: report.lcpMs,
      cls: report.cls,
      firstInputDelayMs: report.firstInputDelayMs,
      domContentLoadedMs: report.domContentLoadedMs,
      loadMs: report.loadMs
    }
    console.info('[perf]', snapshot)
  }

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') emit()
  })

  window.setInterval(emit, 5000)
}

