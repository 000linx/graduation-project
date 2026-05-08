import { expect, type APIRequestContext, type Page, type TestInfo } from '@playwright/test'

export type SeedData = {
  admin: { phone: string; password: string }
  user?: { phone: string; password: string }
}

export function randomPhone(prefix = '138'): string {
  const rand = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, '0')
  return `${prefix}${rand}`.slice(0, 11)
}

export async function uiRegisterAndLogin(page: Page, { username, phone, password }: { username: string; phone: string; password: string }) {
  await page.goto('/register')
  await page.getByPlaceholder('请输入用户名').fill(username)
  await page.getByPlaceholder('请输入 11 位手机号').fill(phone)
  await page.getByPlaceholder('请输入密码').fill(password)
  await page.getByPlaceholder('请再次输入密码').fill(password)
  await page.getByRole('button', { name: '注册并登录' }).click()
  await page.waitForURL('**/profile', { timeout: 40_000 })
}

export async function uiLogin(page: Page, { phone, password }: { phone: string; password: string }) {
  await page.goto('/login')
  await page.getByPlaceholder('请输入 11 位手机号').fill(phone)
  await page.getByPlaceholder('请输入密码').fill(password)
  await page.getByRole('button', { name: '登录' }).click()
  await page.waitForURL('**/profile', { timeout: 40_000 })
}

export async function ensureEnteredMall(page: Page) {
  const enter = page.getByRole('button', { name: '进入商城' })
  try {
    if (await enter.isVisible({ timeout: 800 })) {
      await enter.click()
      await page.waitForURL('**/', { timeout: 20_000 })
    }
  } catch {}
}

export async function ensureAddress(page: Page) {
  await page.goto('/profile')
  await page.getByRole('tab', { name: '收货地址' }).click()
  const addBtn = page.getByRole('button', { name: '新增地址' })
  await addBtn.click()

  await page.getByPlaceholder('请输入收货人姓名').last().fill('张三')
  await page.getByPlaceholder('请输入手机号').last().fill('13800000000')
  const provinceCity = page.getByPlaceholder('如：北京市')
  await provinceCity.nth(0).fill('上海市')
  await provinceCity.nth(1).fill('上海市')
  await page.getByPlaceholder('如：海淀区').last().fill('浦东新区')
  await page.getByPlaceholder('街道、门牌号等').last().fill(`测试路${Date.now()}号`)
  await page.getByRole('button', { name: '保存' }).last().click()
  await expect(page.getByText(/地址已新增|地址已更新/)).toBeVisible({ timeout: 10_000 })
}

export async function adminLogin(request: APIRequestContext, apiBase: string, seed: SeedData) {
  const resp = await request.post(`${apiBase}/api/admin/login`, { data: { phone: seed.admin.phone, password: seed.admin.password } })
  expect(resp.ok()).toBeTruthy()
  const json = await resp.json()
  const token = json?.data?.tokens?.access_token
  expect(token).toBeTruthy()
  return String(token)
}

export async function adminCreateProduct(request: APIRequestContext, apiBase: string, adminToken: string, name: string) {
  const resp = await request.post(`${apiBase}/api/admin/products`, {
    data: { name, category: 'e2e', price: 1999, stock: 99, description: 'e2e', image_url: '', status: 'on_sale' },
    headers: { Authorization: `Bearer ${adminToken}` }
  })
  expect(resp.ok()).toBeTruthy()
  const json = await resp.json()
  const id = json?.data?.product_id
  expect(id).toBeTruthy()
  return String(id)
}

export async function adminUpdateOrderStatus(request: APIRequestContext, apiBase: string, adminToken: string, orderId: string, status: string) {
  const resp = await request.put(`${apiBase}/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
    data: { status },
    headers: { Authorization: `Bearer ${adminToken}` }
  })
  expect(resp.ok()).toBeTruthy()
}

export async function adminUpdateOrderShipping(
  request: APIRequestContext,
  apiBase: string,
  adminToken: string,
  orderId: string,
  payload: { carrier: string; tracking_no: string; status: 'created' | 'in_transit' | 'delivered' }
) {
  const resp = await request.put(`${apiBase}/api/admin/orders/${encodeURIComponent(orderId)}/shipping`, {
    data: { ...payload, events: [] },
    headers: { Authorization: `Bearer ${adminToken}` }
  })
  expect(resp.ok()).toBeTruthy()
}

export async function adminProcessAfterSale(request: APIRequestContext, apiBase: string, adminToken: string, orderId: string, status: 'approved' | 'rejected') {
  const resp = await request.put(`${apiBase}/api/admin/orders/${encodeURIComponent(orderId)}/after_sale`, {
    data: { status, remark: 'e2e' },
    headers: { Authorization: `Bearer ${adminToken}` }
  })
  expect(resp.ok()).toBeTruthy()
}

export async function paymentCallback(request: APIRequestContext, apiBase: string, orderId: string, method: string) {
  const resp = await request.post(`${apiBase}/api/payment/callback`, { data: { order_id: orderId, payment_method: method } })
  expect(resp.ok()).toBeTruthy()
}

export async function collectPerf(page: Page) {
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const navMs = nav ? Math.round(nav.duration) : null
    const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const api = res
      .filter((e) => typeof e.name === 'string' && e.name.includes('/api/') && (e.initiatorType === 'fetch' || e.initiatorType === 'xmlhttprequest'))
      .map((e) => ({ name: e.name, duration_ms: Math.round(e.duration) }))
    return { nav_ms: navMs, api }
  })
  return perf as { nav_ms: number | null; api: { name: string; duration_ms: number }[] }
}

export async function attachPerf(testInfo: TestInfo, key: string, data: any) {
  await testInfo.attach(`${key}.json`, { body: Buffer.from(JSON.stringify(data, null, 2)), contentType: 'application/json' })
}

