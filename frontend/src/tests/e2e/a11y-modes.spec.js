import { test, expect } from '@playwright/test';
test.describe('A11y Modes', () => {
    test('can toggle high contrast and large text, and touch targets meet 48px in large mode', async ({ page }) => {
        await page.route('**/api/product/list**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify({ code: 200, message: 'ok', data: { products: [], pagination: { total_pages: 1 } } })
            });
        });
        await page.route('**/api/product/stream', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'text/event-stream; charset=utf-8',
                body: 'event: ping\ndata: {}\n\n'
            });
        });
        await page.goto('/');
        await page.getByRole('button', { name: '无障碍与适老化设置' }).click();
        await page.locator('[data-testid="a11y-hc"]').click();
        await expect
            .poll(async () => {
            return page.evaluate(() => document.documentElement.classList.contains('hc'));
        })
            .toBe(true);
        await page.locator('[data-testid="a11y-large"]').click();
        await expect
            .poll(async () => {
            return page.evaluate(() => document.documentElement.getAttribute('data-a11y-large'));
        })
            .toBe('1');
        const cart = page.locator('a[aria-label="购物车"]');
        const box = await cart.boundingBox();
        expect(box).toBeTruthy();
        expect(box.width).toBeGreaterThanOrEqual(48);
        expect(box.height).toBeGreaterThanOrEqual(48);
    });
});
//# sourceMappingURL=a11y-modes.spec.js.map