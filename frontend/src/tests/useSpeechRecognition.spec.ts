import { describe, expect, it, vi, beforeEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'

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

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    lastRec = null
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('exposes start/stop and updates state via callbacks', async () => {
    ;(window as any).SpeechRecognition = FakeSpeechRecognition
    const { useSpeechRecognition } = await import('@/hooks/useSpeechRecognition')

    const Comp = defineComponent({
      setup() {
        return useSpeechRecognition({ lang: 'zh-CN' })
      },
      template: '<div />',
    })

    const wrapper = mount(Comp)
    const vm = wrapper.vm as any

    expect(vm.supported).toBe(true)
    expect(vm.start()).toBe(true)
    expect(lastRec).toBeTruthy()

    lastRec.onstart?.()
    expect(vm.listening).toBe(true)

    lastRec.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: '你好' }, isFinal: true }],
    })
    expect(vm.transcript).toBe('你好')

    vm.stop()
    expect(lastRec.stop).toHaveBeenCalled()

    wrapper.unmount()
  })
})

