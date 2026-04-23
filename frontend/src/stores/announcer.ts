import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AnnouncePoliteness = 'polite' | 'assertive'
export type AnnounceTone = 'info' | 'success' | 'warning' | 'error'

type AnnouncePayload = {
  text: string
  politeness?: AnnouncePoliteness
  tone?: AnnounceTone
  flash?: boolean
  ttl_ms?: number
}

export const useAnnouncerStore = defineStore('announcer', () => {
  const text = ref('')
  const politeness = ref<AnnouncePoliteness>('polite')
  const tone = ref<AnnounceTone>('info')
  const flash = ref(false)
  const ttlMs = ref(5000)
  const seq = ref(0)

  function announce(payload: AnnouncePayload) {
    const t = String(payload?.text ?? '').trim()
    if (!t) return
    text.value = t
    politeness.value = payload.politeness === 'assertive' ? 'assertive' : 'polite'
    tone.value = payload.tone ?? 'info'
    flash.value = Boolean(payload.flash)
    ttlMs.value = typeof payload.ttl_ms === 'number' ? Math.max(1000, payload.ttl_ms) : 5000
    seq.value += 1
  }

  function clear() {
    text.value = ''
    flash.value = false
  }

  return { text, politeness, tone, flash, ttlMs, seq, announce, clear }
})

