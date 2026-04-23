import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Login from '@/views/Login.vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import { defineComponent } from 'vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    { path: '/admin/login', component: Login },
    { path: '/', component: { template: '<div>Home</div>' } }
  ]
})

vi.mock('@/components/auth/UserLogin.vue', () => ({ default: { name: 'UserLogin', template: '<div class="user-login-stub"></div>' } }))
vi.mock('@/components/auth/AdminLogin.vue', () => ({ default: { name: 'AdminLogin', template: '<div class="admin-login-stub"></div>' } }))

const AppWrapper = defineComponent({
  template: '<router-view />'
})

describe('Login.vue', () => {
  it('renders switch button correctly and triggers route change', async () => {
    router.push('/login')
    await router.isReady()

    const wrapper = mount(AppWrapper, {
      global: {
        plugins: [router, ElementPlus]
      }
    })

    // Initial state: user mode
    expect(wrapper.text()).toContain('欢迎回来')
    expect(wrapper.text()).toContain('用户登录')
    
    // Switch button should display text to switch to admin
    const switchBtn = wrapper.find('.switch-mode-btn')
    expect(switchBtn.exists()).toBe(true)
    expect(switchBtn.text()).toContain('后台登录')
    
    // Test toggle via click
    await switchBtn.trigger('click')
    await flushPromises()
    
    // Router should be pushed to /admin/login
    expect(router.currentRoute.value.path).toBe('/admin/login')

    // Test toggle via keyboard (Enter)
    const switchBtn2 = wrapper.find('.switch-mode-btn')
    await switchBtn2.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
