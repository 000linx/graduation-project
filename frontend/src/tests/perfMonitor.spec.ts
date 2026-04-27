import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('perfMonitor', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
  })

  it('starts monitor only when perf param exists and emits periodically', async () => {
    window.history.pushState({}, '', '/?perf=1')

    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { domContentLoadedEventEnd: 120, loadEventEnd: 300 } as any,
    ])

    ;(globalThis as any).PerformanceObserver = class {
      cb: any
      constructor(cb: any) {
        this.cb = cb
      }
      observe() {
      }
    }

    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    const { maybeStartPerfMonitor } = await import('@/utils/perfMonitor')
    maybeStartPerfMonitor()

    vi.advanceTimersByTime(5000)
    expect(info).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('does nothing when perf param missing', async () => {
    window.history.pushState({}, '', '/')
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    const { maybeStartPerfMonitor } = await import('@/utils/perfMonitor')
    maybeStartPerfMonitor()

    vi.advanceTimersByTime(6000)
    expect(info).not.toHaveBeenCalled()

    vi.useRealTimers()
  })
})

