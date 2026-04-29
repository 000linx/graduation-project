import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getCoverAlwaysShow, hasSeenCoverInThisSession, markCoverSeen, setCoverAlwaysShow } from '@/utils/coverEntry'

export type CoverMode = 'follow' | 'scatter' | 'gather'

const REDUCE_KEY = 'cover_reduce_motion_v1'
const PARTICLE_SCALE_KEY = 'cover_particle_scale_v1'

export const useCoverStore = defineStore('cover', () => {
    const mode = ref<CoverMode>('follow')
    const reduceMotion = ref(false)
    const perfReduced = ref(false)
    const perfMessage = ref<string | null>(null)
    const alwaysShow = ref(true)
    const particleScale = ref(1)

    const seen = computed(() => hasSeenCoverInThisSession())

    function markSeen() {
        markCoverSeen()
    }

    function init() {
        alwaysShow.value = getCoverAlwaysShow()
        const rm = localStorage.getItem(REDUCE_KEY)
        reduceMotion.value = rm === '1'
        const ps = Number(localStorage.getItem(PARTICLE_SCALE_KEY) ?? '1')
        particleScale.value = Number.isFinite(ps) ? Math.min(5, Math.max(0.1, ps)) : 1
        try {
            if (!reduceMotion.value && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                reduceMotion.value = true
            }
        } catch { }
    }

    function setAlwaysShow(v: boolean) {
        alwaysShow.value = Boolean(v)
        setCoverAlwaysShow(alwaysShow.value)
    }

    function setReduceMotion(v: boolean) {
        reduceMotion.value = Boolean(v)
        localStorage.setItem(REDUCE_KEY, reduceMotion.value ? '1' : '0')
    }

    function setMode(v: CoverMode) {
        mode.value = v
    }

    function setParticleScale(v: number) {
        const next = Number.isFinite(v) ? v : 1
        particleScale.value = Math.min(5, Math.max(0.1, next))
        localStorage.setItem(PARTICLE_SCALE_KEY, String(particleScale.value))
    }

    function setPerfReduced(v: boolean, message?: string | null) {
        perfReduced.value = Boolean(v)
        perfMessage.value = message ?? null
    }

    return {
        mode,
        reduceMotion,
        perfReduced,
        perfMessage,
        alwaysShow,
        particleScale,
        seen,
        init,
        markSeen,
        setAlwaysShow,
        setReduceMotion,
        setMode,
        setParticleScale,
        setPerfReduced
    }
})

