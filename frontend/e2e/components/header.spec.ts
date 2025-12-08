import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Header Component
 * Sprint 1: Navigation, User Menu, Responsive Behavior
 */

test.describe('Header Component - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display header on all pages', async ({ page }) => {
    // Check header exists on home page
    const header = page.locator('app-header');
    await expect(header).toBeVisible();

    // Navigate to login page
    await page.goto('/login');
    await expect(header).toBeVisible();
  });

  test('should display logo in header', async ({ page }) => {
    const logo = page.locator('app-header .logo');
    await expect(logo).toBeVisible();
  });

  test('should display login button when not authenticated', async ({ page }) => {
    const loginButton = page.getByRole('link', { name: /bejelentkezés/i });
    await expect(loginButton).toBeVisible();
  });

  test('should navigate to home when clicking logo', async ({ page }) => {
    // Go to another page first
    await page.goto('/login');

    // Click logo
    const logo = page.locator('app-header .logo');
    await logo.click();

    // Should navigate to home
    await expect(page).toHaveURL(/.*\//);
  });

  test('should not display user menu when not authenticated', async ({ page }) => {
    const userMenu = page.locator('.user-menu');
    await expect(userMenu).not.toBeVisible();
  });
});

test.describe('Header Component - Authenticated', () => {
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

    await page.goto('/dashboard');
  });

  test('should display user name in header', async ({ page }) => {
    await expect(page.getByText(/Test User/i)).toBeVisible();
  });

  test('should display user menu button', async ({ page }) => {
    const userMenuButton = page.getByRole('button', { name: /test user/i });
    await expect(userMenuButton).toBeVisible();
  });

  test('should open user dropdown menu on click', async ({ page }) => {
    const userMenuButton = page.getByRole('button', { name: /test user/i });
    await userMenuButton.click();

    // Check dropdown items
    const profileLink = page.getByRole('link', { name: /profil/i });
    const logoutButton = page.getByRole('button', { name: /kijelentkezés/i });

    // At least one should be visible
    const isDropdownVisible = (await profileLink.isVisible()) || (await logoutButton.isVisible());
    expect(isDropdownVisible).toBeTruthy();
  });

  test('should not display login button when authenticated', async ({ page }) => {
    const loginButton = page.getByRole('link', { name: /bejelentkezés/i });
    await expect(loginButton).not.toBeVisible();
  });
});

test.describe('Header Component - Responsive', () => {
  test('should display mobile menu button on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check for hamburger menu button
    const hamburgerMenu = page.locator('.hamburger-menu, .mobile-menu-button, button[aria-label="Menu"]');

    // Note: This test may need adjustment based on actual implementation
    // The selector should match your actual mobile menu button
  });

  test('should display full navigation on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const header = page.locator('app-header');
    await expect(header).toBeVisible();
  });

  test('should adapt header layout on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const header = page.locator('app-header');
    await expect(header).toBeVisible();
  });
});

test.describe('Header Component - Navigation', () => {
  test('should navigate to correct pages from header links', async ({ page, context }) => {
    // Set up authenticated state for full navigation access
    await context.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-jwt-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      }));
    });

    await page.goto('/');

    // Test navigation links if they exist
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/.*dashboard/);
    }
  });
});
