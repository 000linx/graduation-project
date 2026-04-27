import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAnnouncerStore } from '@/stores/announcer'

describe('announcer store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('announce ignores empty text', () => {
    const store = useAnnouncerStore()
    store.announce({ text: '   ' })
    expect(store.text).toBe('')
    expect(store.seq).toBe(0)
  })

  it('announce updates fields and enforces ttl floor', () => {
    const store = useAnnouncerStore()
    store.announce({ text: 'hi', tone: 'error', politeness: 'assertive', flash: true, ttl_ms: 10 })
    expect(store.text).toBe('hi')
    expect(store.tone).toBe('error')
    expect(store.politeness).toBe('assertive')
    expect(store.flash).toBe(true)
    expect(store.ttlMs).toBe(1000)
    expect(store.seq).toBe(1)
  })

  it('clear resets text/flash', () => {
    const store = useAnnouncerStore()
    store.announce({ text: 'hi', flash: true })
    store.clear()
    expect(store.text).toBe('')
    expect(store.flash).toBe(false)
  })
})

