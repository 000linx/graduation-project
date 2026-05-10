import { test, expect } from '@playwright/test'
import { randomPhone, uiRegisterAndLogin, uiLogin } from '../../e2e/helpers'

test.describe('设备管理（已拥有助听器）', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/user/devices', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: 'Success',
            data: {
              devices: [
                {
                  _id: 'dev_test_001',
                  user_id: 'user_test',
                  model: 'Pro X3 智能降噪款',
                  serial_no: 'SN20250001',
                  purchase_date: '2025-06-01',
                  warranty_end: '2027-06-01',
                  thumbnail: '',
                  status: 'online',
                  firmware_version: '2.1.0',
                  last_sync: '2026-05-09 10:30:00',
                  usage_stats: {
                    total_hours: 340,
                    avg_daily_hours: 4.5,
                    battery_cycles: 85,
                    last_7_days_hours: [2, 3, 4, 5, 3, 2, 4]
                  },
                  created_at: '2025-06-01',
                  updated_at: '2026-05-09'
                },
                {
                  _id: 'dev_test_002',
                  user_id: 'user_test',
                  model: 'Ultra Fit 隐形款',
                  serial_no: 'SN20250002',
                  purchase_date: '2025-08-15',
                  warranty_end: '2027-08-15',
                  thumbnail: '',
                  status: 'offline',
                  firmware_version: '1.8.0',
                  last_sync: '2026-05-01 08:00:00',
                  usage_stats: {
                    total_hours: 120,
                    avg_daily_hours: 3.2,
                    battery_cycles: 50,
                    last_7_days_hours: [0, 0, 1, 0, 2, 0, 0]
                  },
                  created_at: '2025-08-15',
                  updated_at: '2026-05-01'
                }
              ]
            }
          })
        })
        return
      }
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 201,
            message: 'Device bound',
            data: {
              device: {
                _id: 'dev_test_003',
                model: 'New Device',
                serial_no: 'SN_NEW',
                status: 'online',
                thumbnail: '',
                purchase_date: null,
                warranty_end: null,
                firmware_version: '1.0.0',
                last_sync: null,
                usage_stats: { total_hours: 0, avg_daily_hours: 0, battery_cycles: 0, last_7_days_hours: [0,0,0,0,0,0,0] }
              }
            }
          })
        })
        return
      }
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, message: 'Device unbound' })
        })
        return
      }
      await route.continue()
    })

    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { username: '测试用户', phone: '13800000001' }
        })
      })
    })

    await page.route('**/api/order/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { orders: [] } })
      })
    })
  })

  test('正常绑定设备流程', async ({ page }) => {
    await page.goto('/login')
    await uiLogin(page, '13800000001', '123456')

    await page.goto('/profile')
    await page.waitForSelector('text=已拥有助听器')
    await page.click('text=已拥有助听器')

    await expect(page.locator('text=Pro X3 智能降噪款')).toBeVisible()
    await expect(page.locator('text=Ultra Fit 隐形款')).toBeVisible()

    await page.click('text=绑定新设备')
    await page.fill('input[placeholder*="Pro X3"]', 'New Device')
    await page.fill('input[placeholder*="序列号"]', 'SN_NEW')
    await page.click('button:has-text("确认绑定")')

    await page.waitForSelector('text=设备绑定成功')
  })

  test('重复绑定同一序列号设备应提示错误', async ({ page }) => {
    await page.route('**/api/user/devices', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ code: 409, message: 'Device already bound' })
        })
        return
      }
      await route.continue()
    })

    await page.goto('/login')
    await uiLogin(page, '13800000001', '123456')
    await page.goto('/profile')
    await page.click('text=已拥有助听器')

    await page.click('text=绑定新设备')
    await page.fill('input[placeholder*="Pro X3"]', 'Dup Device')
    await page.fill('input[placeholder*="序列号"]', 'SN_DUP')
    await page.click('button:has-text("确认绑定")')

    await expect(page.locator('text=Device already bound')).toBeVisible()
  })

  test('解绑设备并确认', async ({ page }) => {
    await page.goto('/login')
    await uiLogin(page, '13800000001', '123456')
    await page.goto('/profile')
    await page.click('text=已拥有助听器')

    await expect(page.locator('text=Pro X3 智能降噪款')).toBeVisible()

    const moreBtn = page.locator('[aria-label="更多操作"]').first()
    await moreBtn.click()

    await page.click('button:has-text("解绑")')
    await page.waitForSelector('text=确认解绑')
    await page.click('button:has-text("解绑"):right-of(:text("取消"))')

    await page.waitForSelector('text=设备已解绑')
  })

  test('网络异常时展示缓存数据', async ({ page }) => {
    await page.goto('/login')
    await uiLogin(page, '13800000001', '123456')

    await page.evaluate(() => {
      localStorage.setItem('user_devices_cache_v1', JSON.stringify([
        { _id: 'cached_1', model: '离线缓存设备', serial_no: 'CACHED001', status: 'offline', thumbnail: '', purchase_date: null, warranty_end: null, firmware_version: '1.0.0', last_sync: null, usage_stats: { total_hours: 0, avg_daily_hours: 0, battery_cycles: 0, last_7_days_hours: [0,0,0,0,0,0,0] } }
      ]))
    })

    await page.route('**/api/user/devices', async (route) => {
      if (route.request().method() === 'GET') {
        await route.abort('failed')
        return
      }
      await route.continue()
    })

    await page.goto('/profile')
    await page.click('text=已拥有助听器')
    await page.waitForSelector('text=离线缓存设备')
    await expect(page.locator('text=离线缓存设备')).toBeVisible()
  })

  test('查看设备详情', async ({ page }) => {
    await page.route('**/api/user/devices/dev_test_001', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            device: {
              _id: 'dev_test_001',
              model: 'Pro X3 智能降噪款',
              serial_no: 'SN20250001',
              purchase_date: '2025-06-01',
              warranty_end: '2027-06-01',
              thumbnail: '',
              status: 'online',
              firmware_version: '2.1.0',
              last_sync: '2026-05-09 10:30:00',
              usage_stats: { total_hours: 340, avg_daily_hours: 4.5, battery_cycles: 85, last_7_days_hours: [2,3,4,5,3,2,4] }
            }
          }
        })
      })
    })

    await page.goto('/login')
    await uiLogin(page, '13800000001', '123456')
    await page.goto('/profile')
    await page.click('text=已拥有助听器')

    const moreBtn = page.locator('[aria-label="更多操作"]').first()
    await moreBtn.click()
    await page.click('button:has-text("查看详情")')

    await page.waitForSelector('text=固件版本')
    await expect(page.locator('text=2.1.0')).toBeVisible()
    await expect(page.locator('text=SN20250001')).toBeVisible()
    await expect(page.locator('text=340h')).toBeVisible()
  })
})
