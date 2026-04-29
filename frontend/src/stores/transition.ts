import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TransitionStyle = 'to-home' | 'to-cover'

export const useTransitionStore = defineStore('transition', () => {
    const active = ref(false)
    const style = ref<TransitionStyle>('to-home')

    async function run(
        nextStyle: TransitionStyle,
        navigate: () => Promise<any> | any,
        opts: { inMs?: number; outMs?: number } = {}
    ) {
        const inMs = Math.max(60, Number(opts.inMs ?? 220))
        const outMs = Math.max(120, Number(opts.outMs ?? 520))
        style.value = nextStyle
        active.value = true
        await new Promise((r) => window.setTimeout(r, inMs))
        await Promise.resolve(navigate())
        await new Promise((r) => window.setTimeout(r, outMs))
        active.value = false
    }

    return { active, style, run }
})

