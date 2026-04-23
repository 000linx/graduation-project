import { test, expect } from '@playwright/test'

test.describe('Admin Sales Chart', () => {
  test('dashboard renders sales chart and loads data', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('admin_access_token', 'admin-token')
      localStorage.removeItem('access_token')
    })

    await page.route('**/api/admin/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'ok', data: { users: 0, products: 0, orders: 0, total_sales: 0 } })
      })
    })

    await page.route('**/api/admin/sales/series**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 200,
          message: 'ok',
          data: { items: [{ bucket: '2026-04-01', total_sales: 100, count: 2 }], page: 1, page_size: 50, has_more: false }
        })
      })
    })

    await page.goto('/admin')

    await expect(page.locator('text=销售额趋势')).toHaveCount(1)
    await expect(page.locator('text=支持日/周/月/季度/年维度')).toHaveCount(1)
    await expect(page.locator('div.h-\\[360px\\]')).toHaveCount(1)
  })
})

