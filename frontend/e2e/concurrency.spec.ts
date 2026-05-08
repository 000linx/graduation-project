import { test, expect } from '@playwright/test'
import { adminCreateProduct, adminLogin, ensureEnteredMall, randomPhone, uiRegisterAndLogin } from './helpers'

const apiBase = process.env.E2E_API_BASE || 'http://127.0.0.1:5000'
const adminPhone = process.env.E2E_ADMIN_PHONE || ''
const adminPassword = process.env.E2E_ADMIN_PASSWORD || ''

test.describe.parallel('并发下单场景', () => {
  for (const i of [1, 2, 3]) {
    test(`并发用户下单-${i}`, async ({ page, request }) => {
      test.setTimeout(180_000)
      const seed = { admin: { phone: adminPhone, password: adminPassword } }
      expect(seed.admin.phone).toBeTruthy()
      expect(seed.admin.password).toBeTruthy()
      const adminToken = await adminLogin(request, apiBase, seed)
      const productName = `E2E并发商品-${Date.now()}-${i}`
      await adminCreateProduct(request, apiBase, adminToken, productName)

      const phone = randomPhone('137')
      const password = 'Passw0rd!test'
      await uiRegisterAndLogin(page, { username: `e2e_c_${i}_${Date.now()}`, phone, password })

      await page.goto('/')
      await ensureEnteredMall(page)
      await page.goto(`/?q=${encodeURIComponent(productName)}`)
      const card = page.locator('[data-testid="product-card"]').filter({ hasText: productName }).first()
      await expect(card).toBeVisible({ timeout: 20_000 })
      await card.getByTestId('product-card-title-link').click()
      await page.getByTestId('product-detail-add').click()
      await page.getByTestId('header-cart-link').click()
      await page.getByTestId('cart-checkout-button').click()
      await page.getByTestId('checkout-shipping-address').fill(`并发测试地址-${i}`)
      await page.getByTestId('checkout-submit').click()
      await page.waitForURL('**/profile', { timeout: 20_000 })
      await expect(page.getByText('订单创建成功').first()).toBeVisible({ timeout: 10_000 })
    })
  }
})

