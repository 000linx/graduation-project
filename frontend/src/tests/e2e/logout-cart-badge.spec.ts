import { test, expect } from '@playwright/test'

test.describe('Logout Cart Badge', () => {
  test('logout clears cart badge immediately', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 't')
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

    await page.route('**/api/cart/items', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 200,
          message: 'ok',
          data: { items: [{ product_id: 'p1', quantity: 2 }] }
        })
      })
    })

    await page.route('**/api/product/p1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'ok', data: { _id: 'p1', name: '商品A', price: 10 } })
      })
    })

    await page.goto('/')

    const badge = page.locator('a[href="/cart"] span').first()
    await expect(badge).toHaveText('2')

    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'ok', data: { username: '测试用户', phone: '13800138000' } })
      })
    })
    await page.route('**/api/order/history**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'ok', data: { orders: [] } })
      })
    })
    await page.route('**/api/user/addresses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'ok', data: { addresses: [] } })
      })
    })
    await page.route('**/api/user/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'ok', data: {} })
      })
    })

    await page.goto('/profile')
    await page.getByRole('button', { name: '退出登录' }).click()

    await expect(page.locator('.el-message')).toContainText('已退出')
    await expect(badge).toHaveCount(0)
  })
})
