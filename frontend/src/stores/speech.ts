import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type SpeechResult = {
  transcript: string
  isFinal: boolean
}

export const useSpeechStore = defineStore('speech', () => {
  const supported = ref(false)
  const listening = ref(false)
  const transcript = ref('')
  const partial = ref('')
  const error = ref<string | null>(null)

  const hasText = computed(() => Boolean((partial.value || transcript.value).trim()))

  const Ctor: any =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null
  supported.value = Boolean(Ctor)

  let rec: any = null

  function ensure(lang = 'zh-CN') {
    if (!Ctor) return null
    if (rec) return rec
    rec = new Ctor()
    rec.lang = lang
    rec.continuous = true
    rec.interimResults = true
    rec.onstart = () => {
      listening.value = true
      error.value = null
      partial.value = ''
      window.dispatchEvent(new CustomEvent('a11y:speech_status', { detail: { listening: true } }))
    }
    rec.onend = () => {
      listening.value = false
      partial.value = ''
      window.dispatchEvent(new CustomEvent('a11y:speech_status', { detail: { listening: false } }))
    }
    rec.onerror = (e: any) => {
      error.value = e?.error || '语音识别失败'
      window.dispatchEvent(new CustomEvent('a11y:speech_error', { detail: { error: error.value } }))
    }
    rec.onresult = (e: any) => {
      const results: SpeechResult[] = []
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i]
        const t = String(r?.[0]?.transcript ?? '').trim()
        if (!t) continue
        results.push({ transcript: t, isFinal: Boolean(r?.isFinal) })
      }

      const finals = results
        .filter((r) => r.isFinal)
        .map((r) => r.transcript)
        .join(' ')
      const interims = results
        .filter((r) => !r.isFinal)
        .map((r) => r.transcript)
        .join(' ')
      if (finals) transcript.value = [transcript.value, finals].filter(Boolean).join(' ').trim()
      partial.value = interims

      window.dispatchEvent(
        new CustomEvent('a11y:speech_text', {
          detail: {
            transcript: transcript.value,
            partial: partial.value
          }
        })
      )
    }
    return rec
  }

  function start(lang = 'zh-CN') {
    const r = ensure(lang)
    if (!r) return false
    try {
      transcript.value = ''
      partial.value = ''
      r.start()
      return true
    } catch (e: any) {
      error.value = e?.message || '语音识别启动失败'
      return false
    }
  }

  function stop() {
    if (!rec) return
    try {
      rec.stop()
    } catch {}
  }

  function reset() {
    transcript.value = ''
    partial.value = ''
    error.value = null
    window.dispatchEvent(new CustomEvent('a11y:speech_text', { detail: { transcript: '', partial: '' } }))
  }

  return {
    supported,
    listening,
    transcript,
    partial,
    error,
    hasText,
    start,
    stop,
    reset
  }
})
