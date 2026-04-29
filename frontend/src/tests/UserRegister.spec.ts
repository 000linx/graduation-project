import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import UserRegister from '@/components/auth/UserRegister.vue'
import { createRouter, createWebHistory } from 'vue-router'

vi.mock('@/api/http', () => {
  return {
    default: {
      post: vi.fn()
    },
    unwrap: (resp: any) => (resp?.data?.data ?? null)
  }
})

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/register', component: { template: '<div>Register</div>' } },
      { path: '/profile', component: { template: '<div>Profile</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } }
    ]
  })
}

describe('UserRegister', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('registers then auto logs in and redirects', async () => {
    const api = (await import('@/api/http')).default as any
    api.post
      .mockResolvedValueOnce({
        data: { code: 201, message: 'Registration successful', data: { user_id: 'u1' } }
      })
      .mockResolvedValueOnce({
        data: { code: 200, message: 'ok', data: { tokens: { access_token: 'at', refresh_token: 'rt' } } }
      })

    const router = makeRouter()
    router.push('/register')
    await router.isReady()

    const wrapper = mount(UserRegister, {
      global: {
        plugins: [router, ElementPlus]
      }
    })

    await wrapper.find('input[autocomplete="username"]').setValue('测试用户')
    await wrapper.find('input[autocomplete="tel"]').setValue('13800138000')
    await wrapper.find('input[autocomplete="new-password"]').setValue('123456')

    const pwInputs = wrapper.findAll('input[autocomplete="new-password"]')
    await pwInputs[1].setValue('123456')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(localStorage.getItem('access_token')).toBe('at')
    expect(localStorage.getItem('refresh_token')).toBe('rt')
  })
})
