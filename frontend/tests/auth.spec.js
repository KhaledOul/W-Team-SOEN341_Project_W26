import { test, expect } from '@playwright/test';

test.setTimeout(60000);

async function registerUser(page, email, password) {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').nth(0).fill(password);
  await page.locator('input[type="password"]').nth(1).fill(password);

  await page.getByRole('button', { name: /sign up|register/i }).click();
}

test.describe('User Registration and Login', () => {
  test('should successfully register a new user', async ({ page }) => {
    const regEmail = `reg-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
    const regPassword = 'TestPassword123!';

    await registerUser(page, regEmail, regPassword);
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText('Welcome to')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    const loginEmail = `login-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
    const loginPassword = 'TestPassword123!';

    await registerUser(page, loginEmail, loginPassword);
    await expect(page).toHaveURL(/\/home$/);

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.locator('input[type="email"]').fill(loginEmail);
    await page.locator('input[type="password"]').fill(loginPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText('Welcome to')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('nonexistent@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    const error = page.locator('.login-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/incorrect email or password|error occurred during sign-in/i);
  });

  test('should prevent login with empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /sign in|login/i }).click();

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    const emailIsValid = await emailInput.evaluate((el) => el.checkValidity());
    const passwordIsValid = await passwordInput.evaluate((el) => el.checkValidity());

    expect(emailIsValid).toBe(false);
    expect(passwordIsValid).toBe(false);
    await expect(page).toHaveURL(/\/login$/);
  });
});
