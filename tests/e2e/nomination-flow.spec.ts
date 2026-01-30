import { test, expect } from '@playwright/test';
import path from 'path';

// Use the admin auth state for now as they have permissions to verify things, 
// or switch to a specific 'user' state if we separated them.
test.use({ storageState: path.join(__dirname, '../../playwright/.auth/admin.json') });

test.describe('Nomination Flow', () => {

    test('should allow entering Employee ID and proceeding to Profile', async ({ page }) => {
        // 1. Go to TNI Login Page
        await page.goto('/tni');

        // 2. Verify Page Content
        await expect(page.getByRole('heading', { name: /Training Portal/i })).toBeVisible();

        // 3. Fill Employee ID
        // The input has name="empId" and label "Employee ID"
        await page.getByLabel('Employee ID').fill('1001'); // Assuming 1001 is a seeded employee

        // 4. Click Continue
        // Button contains text "Continue"
        await page.getByRole('button', { name: /Continue/i }).click();

        // 5. Verify Redirect
        // Should go to /tni/1001
        await expect(page).toHaveURL(/\/tni\/1001/, { timeout: 10000 });

        // 6. Verify Profile Page Loads (We need to check next page content, but URL check is good start)
    });
});
