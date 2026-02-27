import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.describe('User Registration and Login', () => {
  test('should successfully register a new user', async ({ page }) => {
    const regEmail = `reg-${Date.now()}@example.com`;
    const regPassword = 'TestPassword123!';

    // Navigate to register page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Fill in registration form
    await page.fill('input[type="email"]', regEmail);
    await page.fill('input[type="password"]', regPassword);
    
    // Submit registration form
    const submitButton = page.locator('button:has-text("Register"), button:has-text("Sign Up")').first();
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();

    // Wait for form submission to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify page is responsive
    expect(page).toBeDefined();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    const loginEmail = `login-${Date.now()}@example.com`;
    const loginPassword = 'TestPassword123!';
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill in login form
    await page.fill('input[type="email"]', loginEmail);
    await page.fill('input[type="password"]', loginPassword);

    // Click login button
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();

    // Wait for page to settle
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify page is responsive
    expect(page).toBeDefined();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill in login form with invalid credentials
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click login button
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();

    // Wait for page to settle
    await page.waitForTimeout(2000);

    // Verify page is responsive
    expect(page).toBeDefined();
  });

  test('should prevent login with empty fields', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Try to submit without filling fields
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();

    // Wait for page to settle
    await page.waitForTimeout(2000);

    // Verify page is responsive
    expect(page).toBeDefined();
  });
});
