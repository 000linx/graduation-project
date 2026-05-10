import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/http', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn()
    },
    unwrap: (resp: any) => resp.data.data
  }
})

describe('deviceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('fetchDevices populates devices and writes cache', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({
      data: {
        data: {
          devices: [
            {
              _id: 'd1',
              user_id: 'u1',
              model: 'Pro X3',
              serial_no: 'SN001',
              purchase_date: '2025-01-01',
              warranty_end: '2027-01-01',
              thumbnail: '',
              status: 'online',
              firmware_version: '2.1.0',
              last_sync: null,
              usage_stats: { total_hours: 120, avg_daily_hours: 4, battery_cycles: 30, last_7_days_hours: [1,2,3,4,5,6,7] },
              created_at: '2025-01-01',
              updated_at: '2025-01-01'
            }
          ]
        }
      }
    })

    const { useDeviceStore } = await import('@/stores/device')
    const store = useDeviceStore()
    await store.fetchDevices()

    expect(store.devices.length).toBe(1)
    expect(store.devices[0].model).toBe('Pro X3')
    expect(store.deviceCount).toBe(1)
    expect(store.onlineCount).toBe(1)
    expect(localStorage.getItem('user_devices_cache_v1')).toBeTruthy()
  })

  it('bindDevice adds device to list', async () => {
    const http = (await import('@/api/http')).default as any
    http.post.mockResolvedValueOnce({
      data: {
        data: {
          device: {
            _id: 'd2',
            model: 'Pro X5',
            serial_no: 'SN002',
            status: 'online',
            thumbnail: '',
            purchase_date: null,
            warranty_end: null,
            firmware_version: '1.0.0',
            last_sync: null,
            usage_stats: { total_hours: 0, avg_daily_hours: 0, battery_cycles: 0, last_7_days_hours: [0,0,0,0,0,0,0] }
          }
        }
      }
    })

    const { useDeviceStore } = await import('@/stores/device')
    const store = useDeviceStore()
    await store.bindDevice({ model: 'Pro X5', serial_no: 'SN002' })

    expect(store.devices.length).toBe(1)
    expect(store.devices[0].model).toBe('Pro X5')
  })

  it('unbindDevice removes device with optimistic update', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({
      data: {
        data: {
          devices: [
            { _id: 'd1', model: 'Pro X3', serial_no: 'SN001', status: 'online', thumbnail: '', purchase_date: null, warranty_end: null, firmware_version: '1.0.0', last_sync: null, usage_stats: { total_hours: 0, avg_daily_hours: 0, battery_cycles: 0, last_7_days_hours: [0,0,0,0,0,0,0] } },
            { _id: 'd2', model: 'Pro X5', serial_no: 'SN002', status: 'online', thumbnail: '', purchase_date: null, warranty_end: null, firmware_version: '1.0.0', last_sync: null, usage_stats: { total_hours: 0, avg_daily_hours: 0, battery_cycles: 0, last_7_days_hours: [0,0,0,0,0,0,0] } }
          ]
        }
      }
    })
    http.delete.mockResolvedValueOnce({ data: { code: 200 } })

    const { useDeviceStore } = await import('@/stores/device')
    const store = useDeviceStore()
    await store.fetchDevices()
    expect(store.devices.length).toBe(2)

    await store.unbindDevice('d1')
    expect(store.devices.length).toBe(1)
    expect(store.devices[0]._id).toBe('d2')
  })

  it('rollback on unbind failure restores devices', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({
      data: {
        data: {
          devices: [
            { _id: 'd1', model: 'Pro X3', serial_no: 'SN001', status: 'online', thumbnail: '', purchase_date: null, warranty_end: null, firmware_version: '1.0.0', last_sync: null, usage_stats: { total_hours: 0, avg_daily_hours: 0, battery_cycles: 0, last_7_days_hours: [0,0,0,0,0,0,0] } }
          ]
        }
      }
    })
    http.delete.mockRejectedValueOnce(new Error('Network error'))

    const { useDeviceStore } = await import('@/stores/device')
    const store = useDeviceStore()
    await store.fetchDevices()

    await expect(store.unbindDevice('d1')).rejects.toThrow('解绑失败')
    expect(store.devices.length).toBe(1)
  })

  it('loadCache reads from localStorage when fetch fails', async () => {
    localStorage.setItem('user_devices_cache_v1', JSON.stringify([
      { _id: 'd_cached', model: 'Cached Pro', serial_no: 'SN_CACHED', status: 'offline', thumbnail: '', purchase_date: null, warranty_end: null, firmware_version: '1.0.0', last_sync: null, usage_stats: { total_hours: 0, avg_daily_hours: 0, battery_cycles: 0, last_7_days_hours: [0,0,0,0,0,0,0] } }
    ]))

    const http = (await import('@/api/http')).default as any
    http.get.mockRejectedValueOnce(new Error('Network error'))

    const { useDeviceStore } = await import('@/stores/device')
    const store = useDeviceStore()
    await store.fetchDevices()

    expect(store.error).toBeTruthy()
    expect(store.devices.length).toBe(1)
    expect(store.devices[0].model).toBe('Cached Pro')
  })

  it('bindAuthListener clears devices on logout', async () => {
    const { useDeviceStore } = await import('@/stores/device')
    const store = useDeviceStore()
    store.devices.value = [
      { _id: 'd1', model: 'X', serial_no: 'S1', status: 'online', thumbnail: '', purchase_date: null, warranty_end: null, firmware_version: '1.0.0', last_sync: null, usage_stats: { total_hours: 0, avg_daily_hours: 0, battery_cycles: 0, last_7_days_hours: [0,0,0,0,0,0,0] } } as any
    ]

    store.bindAuthListener()
    window.dispatchEvent(new Event('auth:logout'))

    expect(store.devices.length).toBe(0)
    expect(localStorage.getItem('user_devices_cache_v1')).toBeNull()
  })
})
