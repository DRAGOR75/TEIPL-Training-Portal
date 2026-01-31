import { test, expect } from '@playwright/test';

test.skip('admin login flow', async ({ page }) => {
    await page.goto('/login');

    // Fill in credentials
    await page.getByLabel('Email').fill('admin@thriveni.com');
    await page.getByLabel('Password').fill('thriveni2025');

    // Click login button
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for error message first
    const errorLocator = page.locator('.text-red-700');
    try {
        await expect(errorLocator).toBeVisible({ timeout: 2000 });
        // If we see the error, fail the test with the error message
        const errorText = await errorLocator.textContent();
        throw new Error(`Login failed with error: ${errorText}`);
    } catch (e) {
        // If timeout, it means no error visible, so proceed to check URL
        if (e instanceof Error && e.message.includes('Login failed')) {
            throw e;
        }
    }

    // Wait for navigation or success state
    // Assuming successful login redirects to /admin
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

    // Optional: Check for admin-specific element if we know where it goes
    // await expect(page.getByText('Admin Dashboard')).toBeVisible(); 
});
