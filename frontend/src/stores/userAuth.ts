import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import http from '@/api/http'

export const useUserAuthStore = defineStore('userAuth', () => {
  const verified = ref(false)
  const checking = ref(false)
  const listenerBound = ref(false)

  const isAuthed = computed(() => verified.value)

  function bindLogoutListener() {
    if (listenerBound.value) return
    listenerBound.value = true
    window.addEventListener('auth:logout', () => {
      verified.value = false
      checking.value = false
    })
  }

  async function verifyUser() {
    bindLogoutListener()
    if (checking.value) return verified.value
    checking.value = true
    try {
      await http.get('/api/user/profile')
      verified.value = true
      return true
    } catch {
      verified.value = false
      return false
    } finally {
      checking.value = false
    }
  }

  async function logout() {
    try {
      await http.post('/api/user/logout')
    } catch {}
    verified.value = false
    try {
      window.dispatchEvent(new Event('auth:logout'))
    } catch {}
  }

  return { verified, checking, isAuthed, verifyUser, logout, bindLogoutListener }
})
