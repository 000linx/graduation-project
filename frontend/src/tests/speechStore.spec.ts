import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

let lastRec: any = null

class FakeSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  onstart: any = null
  onend: any = null
  onerror: any = null
  onresult: any = null
  start = vi.fn()
  stop = vi.fn()
  constructor() {
    lastRec = this
  }
}

describe('speech store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    lastRec = null
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('supported is false when SpeechRecognition missing', async () => {
    delete (window as any).SpeechRecognition
    delete (window as any).webkitSpeechRecognition
    const { useSpeechStore } = await import('@/stores/speech')
    const store = useSpeechStore()
    expect(store.supported).toBe(false)
  })

  it('start wires events and updates transcript/partial', async () => {
    ;(window as any).SpeechRecognition = FakeSpeechRecognition

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    const { useSpeechStore } = await import('@/stores/speech')
    const store = useSpeechStore()

    const ok = store.start('zh-CN')
    expect(ok).toBe(true)
    expect(lastRec).toBeTruthy()

    lastRec.onstart?.()
    expect(store.listening).toBe(true)
    expect(dispatchSpy).toHaveBeenCalled()

    lastRec.onresult?.({
      resultIndex: 0,
      results: [
        { 0: { transcript: '你好' }, isFinal: true },
        { 0: { transcript: '世界' }, isFinal: false },
      ],
    })
    expect(store.transcript).toBe('你好')
    expect(store.partial).toBe('世界')
  })

  it('reset clears text and emits event', async () => {
    ;(window as any).SpeechRecognition = FakeSpeechRecognition
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    const { useSpeechStore } = await import('@/stores/speech')
    const store = useSpeechStore()

    store.start()
    store.reset()
    expect(store.transcript).toBe('')
    expect(store.partial).toBe('')
    expect(dispatchSpy).toHaveBeenCalled()
  })
})

