import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import http, { unwrap } from '@/api/http'

export type DeviceStatus = 'online' | 'offline' | 'maintenance'

export type DeviceItem = {
  _id: string
  user_id: string
  model: string
  serial_no: string
  purchase_date: string | null
  warranty_end: string | null
  thumbnail: string
  status: DeviceStatus
  firmware_version: string
  last_sync: string | null
  usage_stats: {
    total_hours: number
    avg_daily_hours: number
    battery_cycles: number
    last_7_days_hours: number[]
  }
  created_at: string
  updated_at: string
}

const CACHE_KEY = 'user_devices_cache_v1'

export const useDeviceStore = defineStore('device', () => {
  const devices = ref<DeviceItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const optimisticOps = ref<Map<string, 'unbinding'>>(new Map())

  const deviceCount = computed(() => devices.value.length)
  const onlineCount = computed(() => devices.value.filter((d) => d.status === 'online').length)

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) devices.value = parsed
      }
    } catch {}
  }

  function saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(devices.value))
    } catch {}
  }

  function clearCache() {
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch {}
  }

  async function fetchDevices() {
    loading.value = true
    error.value = null
    try {
      const resp = await http.get('/api/user/devices')
      const data = unwrap<{ devices: DeviceItem[] }>(resp)
      devices.value = Array.isArray(data?.devices) ? data.devices : []
      saveCache()
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || '加载失败'
      loadCache()
    } finally {
      loading.value = false
    }
  }

  async function bindDevice(payload: {
    model: string
    serial_no: string
    purchase_date?: string
    warranty_end?: string
    thumbnail?: string
  }) {
    const resp = await http.post('/api/user/devices', payload)
    const data = unwrap<{ device: DeviceItem }>(resp)
    if (data?.device) {
      devices.value.unshift(data.device)
      saveCache()
    }
    return data?.device
  }

  function optimisticUnbind(deviceId: string) {
    optimisticOps.value.set(deviceId, 'unbinding')
    const snapshot = devices.value
    devices.value = devices.value.filter((d) => d._id !== deviceId)
    saveCache()
    return snapshot
  }

  function rollbackUnbind(deviceId: string, snapshot: DeviceItem[]) {
    devices.value = snapshot
    optimisticOps.value.delete(deviceId)
    saveCache()
  }

  async function unbindDevice(deviceId: string) {
    optimisticOps.value.set(deviceId, 'unbinding')
    const snapshot = [...devices.value]
    devices.value = devices.value.filter((d) => d._id !== deviceId)
    saveCache()
    try {
      await http.delete(`/api/user/devices/${encodeURIComponent(deviceId)}`)
      optimisticOps.value.delete(deviceId)
    } catch {
      devices.value = snapshot
      saveCache()
      optimisticOps.value.delete(deviceId)
      throw new Error('解绑失败')
    }
  }

  async function fetchDeviceDetail(deviceId: string): Promise<DeviceItem> {
    const resp = await http.get(`/api/user/devices/${encodeURIComponent(deviceId)}`)
    const data = unwrap<{ device: DeviceItem }>(resp)
    return data!.device
  }

  function bindAuthListener() {
    window.addEventListener('auth:logout', () => {
      devices.value = []
      clearCache()
    })
  }

  return {
    devices,
    loading,
    error,
    optimisticOps,
    deviceCount,
    onlineCount,
    loadCache,
    fetchDevices,
    bindDevice,
    unbindDevice,
    optimisticUnbind,
    rollbackUnbind,
    fetchDeviceDetail,
    bindAuthListener,
    clearCache
  }
})
