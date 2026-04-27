import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AnnounceTone } from '@/stores/announcer'

export type ToastTone = AnnounceTone

export type ToastItem = {
    id: string
    text: string
    tone: ToastTone
    ttlMs: number
}

export const useToastStore = defineStore('toast', () => {
    const items = ref<ToastItem[]>([])

    const list = computed(() => items.value)

    function remove(id: string) {
        items.value = items.value.filter((x) => x.id !== id)
    }

    function push(text: string, tone: ToastTone = 'info', ttlMs: number = 3200) {
        const msg = String(text ?? '').trim()
        if (!msg) return null
        const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`
        const ttl = Math.max(1200, Math.min(Number(ttlMs) || 0, 10000))
        items.value.unshift({ id, text: msg, tone, ttlMs: ttl })
        window.setTimeout(() => remove(id), ttl)
        return id
    }

    return { list, push, remove }
})

