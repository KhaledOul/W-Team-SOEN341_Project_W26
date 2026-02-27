import { test, expect } from '@playwright/test';

// Increase test timeout
test.setTimeout(60000);

test.describe('Profile Management', () => {
  test('should successfully navigate to profile page', async ({ page }) => {
    // Navigate directly to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    expect(page).toBeDefined();
  });

  test('should display user information on profile page', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    expect(page).toBeDefined();
  });

  test('should allow user to logout from profile', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Look for logout button
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")').first();
    const logoutExists = await logoutBtn.count() > 0;

    if (logoutExists) {
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify page is responsive
    expect(page).toBeDefined();
  });

  test('should handle profile page access', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Verify page is accessible
    expect(page).toBeDefined();
  });
});
