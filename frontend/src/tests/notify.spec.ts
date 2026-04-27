import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('pinia', async (importActual) => {
  const actual = await importActual<any>()
  return {
    ...actual,
    getActivePinia: vi.fn(),
  }
})

vi.mock('@/stores/toast', () => {
  return {
    useToastStore: vi.fn(() => ({ push: vi.fn(), remove: vi.fn(), list: [] })),
  }
})

vi.mock('@/stores/a11y', () => {
  return {
    useA11yStore: vi.fn(() => ({ ttsEnabled: false })),
  }
})

vi.mock('@/stores/announcer', async (importActual) => {
  const actual = await importActual<any>()
  return {
    ...actual,
    useAnnouncerStore: vi.fn(() => ({ announce: vi.fn() })),
  }
})

describe('notify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing for empty text', async () => {
    const { notify } = await import('@/utils/notify')
    notify('   ')
    const { useToastStore } = await import('@/stores/toast')
    expect(useToastStore as any).not.toHaveBeenCalled()
  })

  it('pushes toast when pinia active', async () => {
    const { getActivePinia } = await import('pinia')
      ; (getActivePinia as any).mockReturnValue({})
    const { useToastStore } = await import('@/stores/toast')

    const { notify } = await import('@/utils/notify')
    notify('ok', { tone: 'success' })
    expect(useToastStore as any).toHaveBeenCalled()
    const toast = (useToastStore as any).mock.results[0].value
    expect(toast.push).toHaveBeenCalledWith('ok', 'success', 3200)
  })

  it('announces via store when pinia active', async () => {
    const { getActivePinia } = await import('pinia')
      ; (getActivePinia as any).mockReturnValue({})

    const { useAnnouncerStore } = await import('@/stores/announcer')
    const { notify } = await import('@/utils/notify')
    notify('x', { tone: 'error', flash: true })

    expect(useAnnouncerStore as any).toHaveBeenCalled()
    const announcer = (useAnnouncerStore as any).mock.results[0].value
    expect(announcer.announce).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'x', tone: 'error', politeness: 'assertive', flash: true })
    )
  })

  it('speaks when enabled', async () => {
    const { getActivePinia } = await import('pinia')
      ; (getActivePinia as any).mockReturnValue({})

    const { useA11yStore } = await import('@/stores/a11y')
      ; (useA11yStore as any).mockReturnValue({ ttsEnabled: true })

    const cancel = vi.fn()
    const speak = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', { value: { cancel, speak }, configurable: true })
      ; (globalThis as any).SpeechSynthesisUtterance = class {
        text: string
        lang: string = ''
        constructor(t: string) {
          this.text = t
        }
      }

    const { notify } = await import('@/utils/notify')
    notify('hello')

    expect(cancel).toHaveBeenCalled()
    expect(speak).toHaveBeenCalled()
  })

  it('can disable speak', async () => {
    const { getActivePinia } = await import('pinia')
      ; (getActivePinia as any).mockReturnValue({})

    const { useA11yStore } = await import('@/stores/a11y')
      ; (useA11yStore as any).mockReturnValue({ ttsEnabled: true })

    const speak = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', { value: { cancel: vi.fn(), speak }, configurable: true })
      ; (globalThis as any).SpeechSynthesisUtterance = class {
        text: string
        lang: string = ''
        constructor(t: string) {
          this.text = t
        }
      }

    const { notify } = await import('@/utils/notify')
    notify('hello', { speak: false })
    expect(speak).not.toHaveBeenCalled()
  })
})
