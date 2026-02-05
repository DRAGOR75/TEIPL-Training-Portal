import { test, expect } from '@playwright/test';

test.describe('System Chaos & Stress Probes', () => {

    test('Rapid Form Submission Multi-Click Chaos', async ({ page }) => {
        // We need a valid session/enrollment URL for this
        // For discovery, we hit the join page
        await page.goto('/join/some-real-or-fake-session');

        // 1. Hammer the submit button if it exists
        const submitBtn = page.getByRole('button', { name: /Submit|Enroll|Join/i });
        if (await submitBtn.isVisible()) {
            // Click 10 times in rapid succession
            for (let i = 0; i < 10; i++) {
                submitBtn.click().catch(() => { });
            }
        }

        // 2. Check for "White Screen of Death"
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('Client-Side Validation Bypass Probe', async ({ page }) => {
        await page.goto('/feedback/employee/test-id'); // Replace with real ID if possible

        // Manually trigger submission with invalid data via script injection
        // This simulates a malicious user bypassing the UI
        await page.evaluate(() => {
            const formData = new FormData();
            formData.append('enrollmentId', 'malicious-id');
            formData.append('q1', '999999');
            // @ts-ignore
            window.submitEmployeeFeedback && window.submitEmployeeFeedback(formData);
        });

        // Check if the page handles the error or crashes
    });
});
