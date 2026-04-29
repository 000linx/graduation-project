import { getActivePinia } from 'pinia'
import { useA11yStore } from '@/stores/a11y'
import { useAnnouncerStore, type AnnounceTone } from '@/stores/announcer'
import { useToastStore } from '@/stores/toast'

type NotifyOptions = {
  tone?: AnnounceTone
  speak?: boolean
  flash?: boolean
}

function speakIfEnabled(text: string) {
  if (!getActivePinia()) return
  const a11y = useA11yStore()
  if (!a11y.ttsEnabled) return
  if (typeof window === 'undefined') return
  const synth = window.speechSynthesis
  if (!synth) return
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'zh-CN'
  try {
    synth.cancel()
    synth.speak(utter)
  } catch {}
}

export function notify(text: string, options: NotifyOptions = {}) {
  const msg = String(text ?? '').trim()
  if (!msg) return

  const tone = options.tone ?? 'info'
  if (getActivePinia()) {
    const toast = useToastStore()
    toast.push(msg, tone, options.flash ? 5200 : 3200)
  } else {
    if (tone === 'error') console.error(msg)
    else if (tone === 'warning') console.warn(msg)
    else console.info(msg)
  }

  if (getActivePinia()) {
    const announcer = useAnnouncerStore()
    announcer.announce({
      text: msg,
      tone,
      politeness: tone === 'error' ? 'assertive' : 'polite',
      flash: Boolean(options.flash)
    })
  }

  const speak = options.speak !== false
  if (speak) speakIfEnabled(msg)
}
