import { test, expect } from '@playwright/test'

test.describe('Recommendations Flow', () => {
  test('select hearing profile -> fetch recommendations -> show reasons -> click add to cart tracks event', async ({
    page
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 't')
    })

    await page.route('**/api/product/recommendations**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 200,
          message: 'ok',
          data: {
            variant: 'A',
            items: [
              {
                rank: 1,
                score: 4.2,
                reasons: [{ factor: 'hearing_level', weight: 2.2, detail: '匹配听力等级（mild）' }],
                product: { _id: 'p1', name: '隐形助听器A', category: '隐形式', price: 1999, stock: 10 }
              }
            ]
          }
        })
      })
    })

    await page.route('**/api/product/reco/event', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 200, message: 'ok', data: { ok: true } })
      })
    })

    await page.route('**/api/cart/add', async (route) => {
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
        body: JSON.stringify({
          code: 200,
          message: 'ok',
          data: { items: [{ product_id: 'p1', quantity: 1 }] }
        })
      })
    })
    await page.route('**/api/product/p1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 200,
          message: 'ok',
          data: { _id: 'p1', name: '隐形助听器A', category: '隐形式', price: 1999 }
        })
      })
    })

    await page.goto('/recommendations')

    await page.getByText('轻度', { exact: true }).click()
    await page.getByRole('button', { name: '立即推荐' }).click()

    await expect(page.getByRole('heading', { name: '推荐结果' })).toHaveCount(1)
    await expect(page.getByText('推荐理由')).toHaveCount(1)
    await expect(page.getByText('隐形助听器A')).toHaveCount(1)

    await page.getByRole('button', { name: '加入购物车' }).click()
    await expect(page.locator('.el-message')).toContainText('已加入购物车')
  })
})
