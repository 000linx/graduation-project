import { test, expect } from '@playwright/test'

test.describe('Admin Authorization', () => {
  test('non-admin token stored as admin token is blocked and redirected to /admin/forbidden', async ({
    page
  }) => {
    await page.route('**/api/admin/me/permissions', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 403, message: 'Admin only' })
      })
    })

    await page.addInitScript(() => {
      localStorage.setItem('admin_access_token', 'fake-user-jwt')
    })

    await page.goto('/admin')
    await page.waitForURL('**/admin/forbidden')

    await expect(page.locator('text=无权限访问').first()).toBeVisible()
    await expect(page.locator('text=管理后台')).toHaveCount(0)
  })
})
