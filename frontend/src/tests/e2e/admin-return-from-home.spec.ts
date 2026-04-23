import { test, expect } from '@playwright/test'

test.describe('Admin Return From Home', () => {
  test('admin token present -> home shows backend entry -> can navigate back to /admin', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('admin_access_token', 'admin-token')
      localStorage.removeItem('access_token')
    })

    await page.route('**/api/product/list**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'ok', data: { products: [], pagination: { total_pages: 1 } } })
      })
    })
    await page.route('**/api/product/stream', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: 'event: ping\ndata: {}\n\n'
      })
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
        body: JSON.stringify({ code: 200, message: 'ok', data: { items: [], page: 1, page_size: 50, has_more: false } })
      })
    })

    await page.goto('/')

    const backendBtn = page.locator('a[aria-label="后台"]')
    await expect(backendBtn).toHaveCount(1)

    await backendBtn.click()
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.locator('text=管理后台')).toHaveCount(1)
  })
})
