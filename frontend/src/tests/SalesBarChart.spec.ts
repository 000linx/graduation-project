import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import SalesBarChart from '@/components/admin/SalesBarChart.vue'

vi.mock('echarts', () => {
  return {
    init: () => {
      return {
        setOption: vi.fn(),
        on: vi.fn(),
        resize: vi.fn(),
        dispose: vi.fn(),
        getDataURL: () => 'data:image/png;base64,xx'
      }
    }
  }
})

vi.mock('@/api/http', () => {
  return {
    default: {
      get: vi.fn()
    },
    unwrap: (resp: any) => resp.data.data
  }
})

describe('SalesBarChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders and loads series', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({
      data: {
        data: {
          items: [{ bucket: '2026-04-01', total_sales: 100, count: 2 }],
          page: 1,
          page_size: 50,
          has_more: false
        }
      }
    })

    const wrapper = mount(SalesBarChart, {
      global: { plugins: [ElementPlus] }
    })

    await flushPromises()
    expect(http.get).toHaveBeenCalled()
    expect(wrapper.text()).toContain('销售额趋势')
    expect(wrapper.find('div.w-full').exists()).toBe(true)
  })

  it('shows empty state when no data', async () => {
    const http = (await import('@/api/http')).default as any
    http.get.mockResolvedValueOnce({
      data: { data: { items: [], page: 1, page_size: 50, has_more: false } }
    })

    const wrapper = mount(SalesBarChart, {
      global: { plugins: [ElementPlus] }
    })

    await flushPromises()
    expect(wrapper.text()).toContain('暂无销售数据')
  })
})
