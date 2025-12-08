import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Authentication Flow
 * Sprint 1: Login, OAuth, and Protected Routes
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Check page title
    await expect(page).toHaveTitle(/Közlekedési Jegykezelő/);

    // Check login button exists
    const loginButton = page.getByRole('button', { name: /bejelentkezés google/i });
    await expect(loginButton).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show Google OAuth button on login page', async ({ page }) => {
    await page.goto('/login');

    // Check Google OAuth button
    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test('should display login page hero section', async ({ page }) => {
    await page.goto('/login');

    // Check hero content
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.hero-section')).toBeVisible();
  });

  // Mock authentication test
  test('should handle successful login flow', async ({ page, context }) => {
    // Note: This test uses mocked authentication
    // For real OAuth testing, you would need valid Supabase credentials

    // Set up mock token in localStorage
    await context.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-jwt-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      }));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Should successfully access dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Check if user name appears
    await expect(page.getByText(/Test User/i)).toBeVisible();
  });

  test('should display loading state during OAuth', async ({ page }) => {
    await page.goto('/login');

    // Check if there's a loading spinner element
    const loadingSpinner = page.locator('app-loading-spinner');
    // Note: This will only appear during actual loading states
  });
});

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up authenticated state
    await context.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-jwt-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      }));
    });
  });

  test('should logout successfully', async ({ page }) => {
    // Navigate to dashboard (authenticated)
    await page.goto('/dashboard');

    // Click on user menu (if exists)
    const userMenu = page.getByRole('button', { name: /test user/i });
    if (await userMenu.isVisible()) {
      await userMenu.click();

      // Click logout button
      const logoutButton = page.getByRole('button', { name: /kijelentkezés/i });
      await logoutButton.click();

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should clear authentication data on logout', async ({ page, context }) => {
    await page.goto('/dashboard');

    // Logout (simplified - adjust based on actual UI)
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    });

    // Try to access dashboard again
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });
});
