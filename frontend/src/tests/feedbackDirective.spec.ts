import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/a11y', () => {
  return {
    useA11yStore: vi.fn(() => ({ interactionFeedback: 'haptic' })),
  }
})

describe('vFeedback directive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('vibrates when interactionFeedback is haptic', async () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })

    const { vFeedback } = await import('@/directives/feedback')
    const el = document.createElement('button')

    vFeedback.mounted?.(el as any, undefined as any, undefined as any, undefined as any)
    el.dispatchEvent(new Event('pointerdown'))

    expect(vibrate).toHaveBeenCalledWith(20)

    vFeedback.unmounted?.(el as any, undefined as any, undefined as any, undefined as any)
  })
})

