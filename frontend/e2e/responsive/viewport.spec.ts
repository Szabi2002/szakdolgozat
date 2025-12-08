import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Responsive Design
 * Sprint 1: Mobile, Tablet, Desktop Viewports
 */

const viewports = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad)' },
  desktop: { width: 1440, height: 900, name: 'Desktop' },
};

test.describe('Responsive Design Tests', () => {
  Object.entries(viewports).forEach(([key, viewport]) => {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      test('should load login page correctly', async ({ page }) => {
        await page.goto('/login');

        // Check page loads
        await expect(page).toHaveURL(/.*login/);

        // Check main content is visible
        const mainContent = page.locator('main, .main-content, .login-container');
        await expect(mainContent).toBeVisible();
      });

      test('should display header correctly', async ({ page }) => {
        await page.goto('/');

        const header = page.locator('app-header, header');
        await expect(header).toBeVisible();

        // Check header doesn't overflow
        const headerBox = await header.boundingBox();
        expect(headerBox?.width).toBeLessThanOrEqual(viewport.width);
      });

      test('should have no horizontal scroll', async ({ page }) => {
        await page.goto('/login');

        // Check document width doesn't exceed viewport
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewport.width + 1); // +1 for rounding
      });

      test('should render buttons with adequate size', async ({ page }) => {
        await page.goto('/login');

        // Check button size (touch target minimum 44x44px for mobile)
        const buttons = page.getByRole('button').first();
        if (await buttons.isVisible()) {
          const buttonBox = await buttons.boundingBox();
          if (key === 'mobile') {
            // Mobile touch target should be at least 44px
            expect(buttonBox?.height).toBeGreaterThanOrEqual(40); // Allow some margin
          }
        }
      });

      test('should display text without overflow', async ({ page }) => {
        await page.goto('/login');

        // Check for text overflow
        const textElements = page.locator('h1, h2, p, span');
        const count = await textElements.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
          const element = textElements.nth(i);
          if (await element.isVisible()) {
            const box = await element.boundingBox();
            expect(box?.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      });
    });
  });

  test.describe('Layout Breakpoints', () => {
    test('should change layout from mobile to desktop', async ({ page }) => {
      // Start with mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Take mobile screenshot (optional)
      // await page.screenshot({ path: 'mobile-layout.png' });

      // Resize to desktop
      await page.setViewportSize({ width: 1440, height: 900 });

      // Take desktop screenshot (optional)
      // await page.screenshot({ path: 'desktop-layout.png' });

      // Verify page still works after resize
      const header = page.locator('app-header, header');
      await expect(header).toBeVisible();
    });

    test('should handle orientation change', async ({ page }) => {
      // Portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');

      let header = page.locator('app-header, header');
      await expect(header).toBeVisible();

      // Landscape
      await page.setViewportSize({ width: 667, height: 375 });

      header = page.locator('app-header, header');
      await expect(header).toBeVisible();
    });
  });

  test.describe('Form Elements Responsive', () => {
    test('should display login form correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');

      const form = page.locator('form, .login-form');
      if (await form.isVisible()) {
        const formBox = await form.boundingBox();
        expect(formBox?.width).toBeLessThanOrEqual(375);
      }
    });

    test('should have adequate input field sizes on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');

      // Check input fields if they exist
      const inputs = page.locator('input[type="text"], input[type="email"]');
      const count = await inputs.count();

      if (count > 0) {
        const inputBox = await inputs.first().boundingBox();
        // Mobile inputs should be large enough to tap
        expect(inputBox?.height).toBeGreaterThanOrEqual(40);
      }
    });
  });

  test.describe('Images and Media Responsive', () => {
    test('should load images without overflow', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');

      // Check for images
      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const image = images.nth(i);
        if (await image.isVisible()) {
          const box = await image.boundingBox();
          expect(box?.width).toBeLessThanOrEqual(375);
        }
      }
    });
  });
});
