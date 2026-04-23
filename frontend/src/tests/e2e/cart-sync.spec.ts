import { test, expect } from '@playwright/test'

test.describe('Cart Sync', () => {
  test('add product -> success -> badge updates -> cart page shows item', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'fake-user-token')
    })

    await page.route('**/api/product/list**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 200,
          message: 'ok',
          data: {
            products: [
              {
                _id: 'p1',
                name: '助听器A（测试）',
                price: 1999,
                category: '耳背式',
                image_url: 'https://example.com/p1.png'
              }
            ],
            pagination: { total_pages: 1 }
          }
        })
      })
    })

    await page.route('**/api/product/stream', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: 'event: ping\ndata: {}\n\n'
      })
    })

    await page.route('**/api/product/p1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 200,
          message: 'ok',
          data: {
            _id: 'p1',
            name: '助听器A（测试）',
            price: 1999,
            category: '耳背式',
            image_url: 'https://example.com/p1.png'
          }
        })
      })
    })

    let cartQty = 0
    await page.route('**/api/cart/add', async (route) => {
      cartQty += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'Item added to cart', data: {} })
      })
    })

    await page.route('**/api/cart/items', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 200,
          message: 'ok',
          data: { items: [{ product_id: 'p1', quantity: cartQty, _id: 'c1', user_id: 'u1' }] }
        })
      })
    })

    await page.goto('/')

    const addBtn = page.locator('button[title="加入购物车"]').first()
    await addBtn.click()

    await expect(page.locator('.el-message')).toContainText('已加入购物车')

    const badge = page.locator('a[href="/cart"] span').first()
    await expect(badge).toHaveText('1')

    await page.goto('/cart')
    await expect(page.locator('text=助听器A（测试）')).toHaveCount(1)
  })
})

