import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // Note: Next.js apps often don't have a specific title unless set in layout/page metadata.
    // We can check for the main heading instead.
    // Check for the main heading
    await expect(page.locator('h1')).toContainText('Training Thriveni');
});

test('navigation to TNI Hub', async ({ page }) => {
    await page.goto('/');

    // Click the TNI Hub link.
    await page.getByRole('link', { name: 'TNI Hub' }).click();

    // Expects page to have a URL containing /tni
    await expect(page).toHaveURL(/.*\/tni/);
});
