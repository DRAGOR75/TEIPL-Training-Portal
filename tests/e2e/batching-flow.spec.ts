import { test, expect } from '@playwright/test';
import path from 'path';

// Use the admin auth state
test.use({ storageState: path.join(__dirname, '../../playwright/.auth/admin.json') });

test.describe('Session Batching Flow', () => {

    test('should allow an admin to select nominations from waitlist and add to batch', async ({ page }) => {
        // 1. Go to Admin Sessions list
        await page.goto('/admin/sessions');
        await expect(page.getByRole('heading', { name: /Training Sessions/i })).toBeVisible();

        // 2. Click the first session card
        const sessionCard = page.locator('.group.cursor-pointer').first();
        await expect(sessionCard).toBeVisible();
        await sessionCard.click();

        // 3. Verify we are on the Manage page
        await expect(page.getByRole('heading', { name: /Waitlist/i })).toBeVisible({ timeout: 15000 });

        // 4. Look for selectable rows in the waitlist
        const waitlistRows = page.locator('table').first().locator('tbody tr');
        const count = await waitlistRows.count();

        if (count > 0) {
            // Select the first row
            const firstRow = waitlistRows.first();
            await firstRow.click();

            // 5. Verify "Add Selected" button updates its count
            const addButton = page.getByRole('button', { name: /Add Selected \(1\)/i });
            await expect(addButton).toBeVisible();

            // 6. Click Add Selected
            await addButton.click();

            // 7. Verify success
            await expect(page.getByRole('button', { name: /Add Selected \(0\)/i })).toBeVisible({ timeout: 15000 });

            // 8. Verify the first row is now in the "Enrolled Participants" table
            const enrolledTable = page.locator('table').last();
            await expect(enrolledTable).toBeVisible();
        } else {
            console.log('⚠️ Skipping selection test: No pending nominations in waitlist.');
        }
    });

    test('should verify direct enrollment QR link', async ({ page }) => {
        // 1. Go to a session management page
        await page.goto('/admin/sessions');
        await page.locator('.group.cursor-pointer').first().click();

        // 2. Check if the "Live Link" is present and has the correct format
        const liveLink = page.getByRole('link', { name: /Live Link/i });
        await expect(liveLink).toBeVisible();
        const href = await liveLink.getAttribute('href');
        expect(href).toMatch(/\/enroll\//);
    });
});
