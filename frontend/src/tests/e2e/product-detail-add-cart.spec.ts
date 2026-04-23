import { test, expect } from '@playwright/test'

test.describe('Product Detail Add To Cart', () => {
  test('add from product detail updates badge and cart', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 't')
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
            name: '详情商品A',
            price: 99,
            stock: 10,
            category: '耳背式',
            description: '用于详情页加购测试',
            image_url: 'https://example.com/p1.webp'
          }
        })
      })
    })

    let cartQty = 0
    await page.route('**/api/cart/add', async (route) => {
      const body = route.request().postDataJSON?.() as any
      cartQty += Number(body?.quantity ?? 1)
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'ok', data: {} })
      })
    })

    await page.route('**/api/cart/items', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'ok', data: { items: [{ product_id: 'p1', quantity: cartQty }] } })
      })
    })

    await page.goto('/product/p1')
    await expect(page.locator('text=详情商品A')).toHaveCount(1)

    await page.getByRole('button', { name: '加入购物车' }).click()
    await expect(page.locator('.el-message')).toContainText('已加入购物车')

    const badge = page.locator('a[href="/cart"] span').first()
    await expect(badge).toHaveText('1')
  })
})

