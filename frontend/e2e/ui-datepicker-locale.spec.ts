import { expect, test } from '@playwright/test'

test('日期区间选择器中文化（月份/星期/按钮）', async ({ page }) => {
  const adminPhone = process.env.E2E_ADMIN_PHONE || '19900000000'
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || '123456'

  await page.goto('/admin/login')
  await page.getByPlaceholder('请输入管理员手机号').fill(adminPhone)
  await page.getByPlaceholder('请输入管理员密码').fill(adminPassword)

  const captchaText = (await page.locator('div[title="点击刷新验证码"] span').innerText()).trim()
  await page.getByPlaceholder('请输入验证码').fill(captchaText)

  await page.getByRole('button', { name: '登录后台' }).click()
  await expect(page.getByRole('status').filter({ hasText: /^管理员登录成功$/ })).toBeVisible({
    timeout: 20_000
  })

  await page.goto('/admin')
  await expect(page.getByText('销售额趋势')).toBeVisible({ timeout: 40_000 })

  await expect(page.getByRole('combobox', { name: '开始日期' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: '结束日期' })).toBeVisible()

  await page.getByRole('combobox', { name: '开始日期' }).click()
  await page.waitForTimeout(600)

  const panel = page.locator('.el-picker-panel.el-date-range-picker').first()
  await expect(panel).toBeVisible({ timeout: 15_000 })

  await expect(panel).toContainText('日')
  await expect(panel).toContainText('一')
  await expect(panel).toContainText('二')
  await expect(panel).toContainText('三')
  await expect(panel).toContainText('四')
  await expect(panel).toContainText('五')
  await expect(panel).toContainText('六')

  await expect(panel.getByRole('button', { name: '取消' })).toBeVisible()
  await expect(panel.getByRole('button', { name: '确定' })).toBeVisible()

  await expect(panel).toContainText('年')
  await expect(panel).toContainText('月')
})

