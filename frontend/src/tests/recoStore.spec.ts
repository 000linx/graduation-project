import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRecoStore } from '@/stores/reco'

vi.mock('@/api/http', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn()
    },
    unwrap: (resp: any) => resp.data.data
  }
})

describe('reco store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('init creates anon/session ids and loads cached profile', () => {
    localStorage.setItem(
      'hearing_profile_v1',
      JSON.stringify({
        hearing_level: '中度',
        scenes: ['会议'],
        budget_min: 1000,
        budget_max: 3000,
        brands: ['A']
      })
    )

    const store = useRecoStore()
    store.init()

    expect(store.anonId).toBeTruthy()
    expect(store.sessionId).toBeTruthy()
    expect(store.profile.hearing_level).toBe('中度')
    expect(store.profile.scenes).toEqual(['会议'])
  })

  it('fetchRecommendations returns empty when missing hearing_level', async () => {
    const http = (await import('@/api/http')).default as any
    const store = useRecoStore()
    store.init()

    await store.fetchRecommendations()
    expect(http.get).not.toHaveBeenCalled()
    expect(store.items).toEqual([])
  })

  it('fetchRecommendations calls api and sets variant/items', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({
      data: { data: { variant: 'B', items: [{ rank: 1, score: 0.9, reasons: [], product: { _id: 'p1' } }] } }
    })

    const store = useRecoStore()
    store.profile.hearing_level = '轻度'
    store.profile.scenes = ['地铁']
    store.profile.brands = ['X']

    await store.fetchRecommendations(5)
    expect(store.variant).toBe('B')
    expect(store.items.length).toBe(1)
    expect(http.get).toHaveBeenCalled()
  })

  it('fetchRecommendations sets error on failure', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockRejectedValueOnce({ message: 'fail' })

    const store = useRecoStore()
    store.profile.hearing_level = '轻度'
    await store.fetchRecommendations()

    expect(store.items).toEqual([])
    expect(store.error).toBe('fail')
  })

  it('track ignores failures', async () => {
    const http = (await import('@/api/http')).default as any
    http.post.mockRejectedValueOnce(new Error('x'))

    const store = useRecoStore()
    store.profile.hearing_level = '轻度'
    await store.track('impression', { product_id: 'p1', rank: 1 })
    expect(http.post).toHaveBeenCalled()
  })

  it('loadProfileFromAccount merges and persists', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({
      data: {
        data: {
          hearing_profile: {
            hearing_level: '重度',
            scenes: ['电视'],
            budget_min: 2000,
            budget_max: 4000,
            brands: ['B']
          }
        }
      }
    })

    const store = useRecoStore()
    store.profile.hearing_level = '轻度'
    await store.loadProfileFromAccount()

    expect(store.profile.hearing_level).toBe('重度')
    expect(localStorage.getItem('hearing_profile_v1')).toContain('重度')
  })

  it('saveProfileToAccount persists then calls api', async () => {
    const http = (await import('@/api/http')).default as any
    http.put.mockResolvedValueOnce({ data: { data: {} } })

    const store = useRecoStore()
    store.profile.hearing_level = '中度'
    await store.saveProfileToAccount()

    expect(localStorage.getItem('hearing_profile_v1')).toContain('中度')
    expect(http.put).toHaveBeenCalled()
  })
})
