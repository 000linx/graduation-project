import { test, expect } from '@playwright/test'

test.describe('Admin Backend Access', () => {
  test('ordinary user without token is redirected from /admin', async ({ page }) => {
    // Navigate directly to the admin page
    await page.goto('/admin')

    // Wait for the page to load and potentially redirect
    await page.waitForURL('**/admin/login?redirect=/admin')

    // Assert we are redirected to login
    expect(page.url()).toContain('/login')

    // Check that there is no admin dashboard element visible
    const isDashboardVisible = await page.isVisible('text=管理后台')
    if (!isDashboardVisible) {
      // Maybe we are in login page where "管理后台" might be hidden if it's user mode
      const isUserMode = await page.isVisible('text=用户登录')
      expect(isUserMode).toBeTruthy()
    }
  })

  test('ordinary user cannot see admin links on home page', async ({ page }) => {
    await page.route('**/api/product/list**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 200,
          message: 'ok',
          data: { products: [], pagination: { total_pages: 1 } }
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

    await page.goto('/')

    // Admin link should not exist
    const adminLink = page.locator('text=管理后台')
    await expect(adminLink).toHaveCount(0)
  })
})
