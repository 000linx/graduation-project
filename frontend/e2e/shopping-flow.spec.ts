import { test, expect } from '@playwright/test'
import {
  adminCreateProduct,
  adminLogin,
  adminProcessAfterSale,
  adminUpdateOrderShipping,
  adminUpdateOrderStatus,
  attachPerf,
  collectPerf,
  ensureEnteredMall,
  ensureAddress,
  paymentCallback,
  randomPhone,
  uiRegisterAndLogin
} from './helpers'

const apiBase = process.env.E2E_API_BASE || 'http://127.0.0.1:5000'
const adminPhone = process.env.E2E_ADMIN_PHONE || ''
const adminPassword = process.env.E2E_ADMIN_PASSWORD || ''

test.describe('用户完整购物流程', () => {
  test('注册/浏览搜索/加购/结算/优惠券/下单/支付/回调/状态&物流/确认收货/售后退款', async ({ page, request }, testInfo) => {
    testInfo.setTimeout(180_000)

    const seed = { admin: { phone: adminPhone, password: adminPassword } }
    expect(seed.admin.phone).toBeTruthy()
    expect(seed.admin.password).toBeTruthy()

    const adminToken = await adminLogin(request, apiBase, seed)
    const productName = `E2E商品-${Date.now()}`
    await adminCreateProduct(request, apiBase, adminToken, productName)

    const phone = randomPhone('138')
    const password = 'Passw0rd!test'
    await uiRegisterAndLogin(page, { username: `e2e_${Date.now()}`, phone, password })
    await attachPerf(testInfo, 'perf.profile.after-register', await collectPerf(page))

    await page.goto('/')
    await ensureEnteredMall(page)
    await page.goto(`/?q=${encodeURIComponent(productName)}`)
    const firstCard = page.locator('[data-testid="product-card"]').filter({ hasText: productName }).first()
    await expect(firstCard).toBeVisible({ timeout: 20_000 })
    await attachPerf(testInfo, 'perf.home.after-search', await collectPerf(page))

    await firstCard.getByTestId('product-card-title-link').click()
    await expect(page.getByTestId('product-detail-add')).toBeVisible({ timeout: 20_000 })
    await attachPerf(testInfo, 'perf.product.detail', await collectPerf(page))

    await page.getByTestId('product-detail-add').click()
    await page.getByTestId('header-cart-link').click()
    await expect(page.getByRole('heading', { name: '您的购物车' })).toBeVisible({ timeout: 20_000 })
    const cartRow = page.locator('tr').filter({ hasText: productName }).first()
    await expect(cartRow).toBeVisible({ timeout: 20_000 })
    await attachPerf(testInfo, 'perf.cart.loaded', await collectPerf(page))

    const inc = page.locator('.el-input-number__increase').first()
    if (await inc.count()) await inc.click()
    await page.waitForTimeout(300)

    await cartRow.getByRole('button', { name: '删除' }).click()
    await page.waitForTimeout(300)

    await page.goto('/')
    await ensureEnteredMall(page)
    await page.goto(`/?q=${encodeURIComponent(productName)}`)
    const secondCard = page.locator('[data-testid="product-card"]').filter({ hasText: productName }).first()
    await secondCard.getByTestId('product-card-title-link').click()
    await page.getByTestId('product-detail-add').click()
    await page.getByTestId('header-cart-link').click()
    await expect(page.locator('tr').filter({ hasText: productName }).first()).toBeVisible({ timeout: 20_000 })

    if (!String(testInfo.project.name).includes('mobile')) {
      await ensureAddress(page)
    }

    await page.goto('/cart')
    await page.getByTestId('cart-checkout-button').click()
    await expect(page.getByRole('heading', { name: '订单结算' })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('checkout-shipping-address').fill('上海市 测试路 1 号')
    const couponSection = page.locator('[aria-label="优惠券"]').first()
    await couponSection.locator('.el-select').click()
    await page.getByRole('option', { name: /OFF10/ }).click()
    await attachPerf(testInfo, 'perf.checkout.before-submit', await collectPerf(page))

    await page.getByTestId('checkout-submit').click()
    await page.waitForURL('**/profile', { timeout: 20_000 })
    await attachPerf(testInfo, 'perf.profile.after-order', await collectPerf(page))

    const historyResp = await page.request.get(`${apiBase}/api/order/history`)
    expect(historyResp.ok()).toBeTruthy()
    const historyJson = await historyResp.json()
    const orders = Array.isArray(historyJson?.data?.orders) ? historyJson.data.orders : []
    const latest = orders[0] ?? null
    const orderId = String(latest?._id ?? latest?.id ?? '').trim()
    expect(orderId).toBeTruthy()
    const orderRow = () =>
      page
        .locator('tr')
        .filter({ has: page.locator(`[data-testid="order-id"][data-order-id="${orderId}"]`) })
        .first()

    await orderRow().getByTestId('order-action-detail').click()
    await expect(page.getByText('优惠券：OFF10')).toBeVisible({ timeout: 10_000 })

    await page.keyboard.press('Escape').catch(() => {})

    await orderRow().getByTestId('order-action-pay').click()
    await page.getByText('选择支付方式').click().catch(() => {})
    await page.getByText('银行卡').click()
    await page.getByRole('button', { name: '确认支付' }).click()
    await expect(page.getByText('支付成功')).toBeVisible({ timeout: 10_000 })
    await paymentCallback(request, apiBase, orderId, 'card')

    await adminUpdateOrderShipping(request, apiBase, adminToken, orderId, {
      carrier: '顺丰',
      tracking_no: `SF${Date.now()}`,
      status: 'in_transit'
    })
    await adminUpdateOrderStatus(request, apiBase, adminToken, orderId, 'shipped')

    await page.reload()
    await expect(orderRow().getByText('已发货').first()).toBeVisible({ timeout: 20_000 })

    await adminUpdateOrderShipping(request, apiBase, adminToken, orderId, {
      carrier: '顺丰',
      tracking_no: `SF${Date.now()}`,
      status: 'delivered'
    })
    await adminUpdateOrderStatus(request, apiBase, adminToken, orderId, 'delivered')
    await page.reload()
    await expect(orderRow().getByText('已送达').first()).toBeVisible({ timeout: 20_000 })

    await orderRow().getByTestId('order-action-detail').click()
    await expect(page.getByText('物流：')).toBeVisible({ timeout: 10_000 })
    await page.keyboard.press('Escape').catch(() => {})

    await orderRow().getByTestId('order-action-confirm').click()
    await page.locator('.el-message-box').getByRole('button', { name: '确认' }).click()
    await expect(page.getByText('已确认收货')).toBeVisible({ timeout: 10_000 })

    await orderRow().getByTestId('order-action-review').click()
    await page.getByRole('dialog').last().getByRole('button', { name: '提交' }).click()
    await expect(page.getByText('评价已提交')).toBeVisible({ timeout: 10_000 })

    await orderRow().getByTestId('order-action-after-sale').click()
    const afterSaleDialog = page.getByRole('dialog', { name: '售后申请' })
    await expect(afterSaleDialog).toBeVisible({ timeout: 20_000 })
    await afterSaleDialog.locator('.el-select').first().click({ force: true })
    await page.getByText('仅退款').click()
    await afterSaleDialog.getByPlaceholder('请输入售后原因').fill('不想要了')
    await afterSaleDialog.getByRole('button', { name: '提交' }).click()
    await expect(page.getByText('售后申请已提交')).toBeVisible({ timeout: 10_000 })

    await adminProcessAfterSale(request, apiBase, adminToken, orderId, 'approved')
    await page.reload()
    await expect(orderRow().getByText('售后已通过').first()).toBeVisible({ timeout: 20_000 })

    await attachPerf(testInfo, 'perf.profile.final', await collectPerf(page))
  })
})

