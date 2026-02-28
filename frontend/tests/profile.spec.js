import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.describe('Profile Management', () => {
  test('should render landing page for unknown /profile route', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should show logged-out navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.getByLabel('Main navigation');
    await expect(nav.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Logout' })).toHaveCount(0);
  });

  test('should navigate to login from landing button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('should show not-logged-in message when opening home directly', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('You are not logged in.')).toBeVisible();
    await expect(page.getByRole('link', { name: /go to login/i })).toBeVisible();
  });
});
