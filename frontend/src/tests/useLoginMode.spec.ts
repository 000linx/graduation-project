import { describe, it, expect, vi } from 'vitest'
import { useLoginMode } from '@/hooks/useLoginMode'
import { ref } from 'vue'

const mockPath = ref('/login')
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: mockPath.value }),
  useRouter: () => ({ push: mockPush })
}))

describe('useLoginMode', () => {
  it('identifies user mode correctly', () => {
    mockPath.value = '/login'
    const { isUserMode, isAdminMode } = useLoginMode()
    expect(isUserMode.value).toBe(true)
    expect(isAdminMode.value).toBe(false)
  })

  it('identifies admin mode correctly', () => {
    mockPath.value = '/admin/login'
    const { isUserMode, isAdminMode } = useLoginMode()
    expect(isUserMode.value).toBe(false)
    expect(isAdminMode.value).toBe(true)
  })

  it('toggles mode correctly from user to admin', async () => {
    mockPath.value = '/login'
    const { toggleMode } = useLoginMode()
    await toggleMode()
    expect(mockPush).toHaveBeenCalledWith('/admin/login')
  })

  it('toggles mode correctly from admin to user', async () => {
    mockPath.value = '/admin/login'
    mockPush.mockClear()
    const { toggleMode } = useLoginMode()
    await toggleMode()
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})
