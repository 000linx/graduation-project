import { test, expect } from '@playwright/test'

test('首页关键填充模块可用且可键盘访问', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('section[aria-label="主视觉轮播"]')).toBeVisible()
  await expect(page.locator('aside[aria-label="侧边栏"]')).toBeVisible()
  await expect(page.locator('footer[aria-label="页脚"]')).toBeVisible()

  await page.keyboard.press('Tab')
  const focusedText = await page.evaluate(() => (document.activeElement?.textContent ?? '').trim())
  expect(focusedText).toContain('跳到主要内容')

  await page.keyboard.press('Enter')
  await page.waitForTimeout(50)
  const activeId = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.id ?? '')
  expect(activeId).toBe('main-content')
})

