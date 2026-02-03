import { test as setup, expect } from '@playwright/test';
import path from 'path';

// Define paths for storage states
const adminFile = path.join(__dirname, '../../playwright/.auth/admin.json');
const userFile = path.join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate as admin', async ({ page }) => {
    // Perform authentication steps for Admin
    // For now, we will perform a real login flow
    // Ideally, stick to seeding logic if possible to bypass UI login speed, 
    // but UI login is safer to test the detailed flow.

    await page.goto('/login');
    await page.locator('input[name="email"]').fill('admin@thriveni.com');
    await page.locator('input[name="password"]').fill('thriveni2025');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for explicit error to fail fast
    const errorMsg = page.locator('text=Invalid email or password');
    if (await errorMsg.isVisible()) {
        throw new Error("Login failed with 'Invalid email or password'");
    }

    // specific to your app's success state
    await page.waitForURL('/admin', { timeout: 30000 });

    // Save state
    await page.context().storageState({ path: adminFile });
});

// We can add more roles here later (e.g. manager, employee)
