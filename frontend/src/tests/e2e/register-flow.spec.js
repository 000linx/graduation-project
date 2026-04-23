import { test, expect } from '@playwright/test';
test.describe('Register Flow', () => {
    test('register -> auto login -> redirect to profile', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.clear();
        });
        await page.route('**/api/user/register', async (route) => {
            await route.fulfill({
                status: 201,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify({ code: 201, message: 'Registration successful', data: { user_id: 'u1' } })
            });
        });
        await page.route('**/api/user/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify({ code: 200, message: 'ok', data: { tokens: { access_token: 'at', refresh_token: 'rt' } } })
            });
        });
        await page.route('**/api/user/profile', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify({ code: 200, message: 'ok', data: { username: '测试用户', phone: '13800138000' } })
            });
        });
        await page.route('**/api/order/history**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify({ code: 200, message: 'ok', data: { orders: [] } })
            });
        });
        await page.route('**/api/user/addresses', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify({ code: 200, message: 'ok', data: { addresses: [] } })
            });
        });
        await page.goto('/register');
        const card = page.locator('div.bg-white').filter({ hasText: '注册账号' }).first();
        await expect(card).toBeVisible();
        await card.getByPlaceholder('请输入用户名').fill('测试用户');
        await card.getByPlaceholder('请输入 11 位手机号').fill('13800138000');
        await card.getByPlaceholder('请输入密码').fill('123456');
        await card.getByPlaceholder('请再次输入密码').fill('123456');
        await card.getByRole('button', { name: '注册并登录' }).click();
        await page.waitForURL('**/profile');
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        expect(token).toBe('at');
    });
});
//# sourceMappingURL=register-flow.spec.js.map