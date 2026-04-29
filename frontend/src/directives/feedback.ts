import type { ObjectDirective } from 'vue'
import { useA11yStore } from '@/stores/a11y'

let audioCtx: AudioContext | null = null

function beep() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    audioCtx = audioCtx ?? new Ctx()
    const ctx = audioCtx
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.04
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t0 = ctx.currentTime
    osc.start(t0)
    osc.stop(t0 + 0.06)
  } catch {}
}

export const vFeedback: ObjectDirective<HTMLElement, void> = {
  mounted(el) {
    const onDown = () => {
      const a11y = useA11yStore()
      const mode = a11y.interactionFeedback
      if (mode === 'haptic') {
        try {
          if (navigator.vibrate) navigator.vibrate(20)
        } catch {}
      } else if (mode === 'sound') {
        beep()
      }
    }
    ;(el as any).__a11y_onDown = onDown
    el.addEventListener('pointerdown', onDown, { passive: true })
  },
  unmounted(el) {
    const onDown = (el as any).__a11y_onDown as any
    if (onDown) el.removeEventListener('pointerdown', onDown)
  }
}
