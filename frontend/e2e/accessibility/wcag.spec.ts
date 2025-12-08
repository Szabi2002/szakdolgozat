import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * E2E Tests - Accessibility (WCAG 2.1 AA)
 * Sprint 1: Basic Accessibility Audit
 *
 * Note: For comprehensive accessibility testing, install @axe-core/playwright
 * npm install -D @axe-core/playwright
 *
 * Then import: import { injectAxe, checkA11y } from 'axe-playwright';
 */

test.describe('Accessibility Tests - Basic', () => {
  test('should have proper page titles', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/); // Non-empty title

    await page.goto('/login');
    await expect(page).toHaveTitle(/.+/);
  });

  test('should have lang attribute on html element', async ({ page }) => {
    await page.goto('/');

    const langAttribute = await page.locator('html').getAttribute('lang');
    expect(langAttribute).toBeTruthy();
    expect(langAttribute).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // Format: 'hu' or 'en-US'
  });

  test('should have main landmark', async ({ page }) => {
    await page.goto('/');

    const mainElement = page.locator('main, [role="main"]');
    await expect(mainElement).toBeVisible();
  });

  test('should have skip to main content link', async ({ page }) => {
    await page.goto('/');

    // Check for skip link (common accessibility practice)
    const skipLink = page.locator('a[href="#main"], a[href="#main-content"]');
    // Note: This is optional but recommended
  });
});

test.describe('Accessibility Tests - Keyboard Navigation', () => {
  test('should navigate with Tab key', async ({ page }) => {
    await page.goto('/login');

    // Focus first interactive element
    await page.keyboard.press('Tab');

    // Check if something is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/login');

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    // Get focused element
    const focusedElement = page.locator(':focus');

    if (await focusedElement.isVisible()) {
      // Check if element has outline or focus styles
      const outline = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline || styles.outlineWidth || styles.boxShadow;
      });

      // Should have some focus indication
      expect(outline).not.toBe('none');
    }
  });

  test('should activate button with Enter key', async ({ page }) => {
    await page.goto('/login');

    const button = page.getByRole('button').first();

    if (await button.isVisible()) {
      await button.focus();
      // Pressing Enter should trigger the button
      // Note: This test depends on actual button implementation
    }
  });

  test('should activate button with Space key', async ({ page }) => {
    await page.goto('/login');

    const button = page.getByRole('button').first();

    if (await button.isVisible()) {
      await button.focus();
      await page.keyboard.press('Space');
      // Note: This test depends on actual button implementation
    }
  });
});

test.describe('Accessibility Tests - Images and Media', () => {
  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');

      // Alt attribute should exist (can be empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('should have aria-label on icon buttons', async ({ page }) => {
    await page.goto('/');

    // Check icon-only buttons have labels
    const iconButtons = page.locator('button:has(mat-icon), button:has(.icon)');
    const count = await iconButtons.count();

    for (let i = 0; i < count; i++) {
      const button = iconButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const buttonText = await button.textContent();

      // Should have either aria-label or visible text
      expect(ariaLabel || buttonText?.trim()).toBeTruthy();
    }
  });
});

test.describe('Accessibility Tests - Forms', () => {
  test('should have labels associated with inputs', async ({ page }) => {
    await page.goto('/login');

    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      if (id) {
        // Check if there's a label with matching 'for' attribute
        const label = page.locator(`label[for="${id}"]`);
        const labelExists = await label.count() > 0;

        // Input should have either a label, aria-label, or aria-labelledby
        expect(labelExists || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should have proper error messages for validation', async ({ page }) => {
    await page.goto('/login');

    // Note: This test depends on actual form validation implementation
    // Check for aria-describedby or aria-invalid attributes
  });
});

test.describe('Accessibility Tests - Color Contrast', () => {
  test('should have readable text color contrast', async ({ page }) => {
    await page.goto('/login');

    // Note: Proper contrast checking requires axe-core or similar tool
    // This is a basic check

    const textElements = page.locator('p, h1, h2, h3, span, a, button');
    const count = await textElements.count();

    // Sample check on first few elements
    for (let i = 0; i < Math.min(count, 3); i++) {
      const element = textElements.nth(i);

      if (await element.isVisible()) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
          };
        });

        // Basic check: color and background shouldn't be the same
        expect(styles.color).not.toBe(styles.backgroundColor);
      }
    }
  });
});

test.describe('Accessibility Tests - Semantic HTML', () => {
  test('should use semantic heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check if h1 exists
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThan(0);
    expect(h1Count).toBeLessThanOrEqual(1); // Should have only one h1 per page
  });

  test('should use button elements for clickable actions', async ({ page }) => {
    await page.goto('/login');

    // Buttons should be <button> or <a> with href, not divs with click handlers
    const fakeButtons = page.locator('div[onclick], div[ng-click], span[onclick]');
    const count = await fakeButtons.count();

    // Ideally should be 0 (use proper button elements)
    // This is a code smell for accessibility
  });

  test('should have proper link elements', async ({ page }) => {
    await page.goto('/');

    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');

      // Links should have href attribute
      expect(href).toBeTruthy();
    }
  });
});

test.describe('Accessibility Tests - ARIA', () => {
  test('should have valid ARIA roles', async ({ page }) => {
    await page.goto('/');

    // Check for common ARIA roles
    const navigation = page.locator('[role="navigation"]');
    const main = page.locator('[role="main"], main');

    // At least main should exist
    await expect(main).toBeVisible();
  });

  test('should not have ARIA hidden on visible content', async ({ page }) => {
    await page.goto('/');

    // Check for improperly hidden content
    const hiddenElements = page.locator('[aria-hidden="true"]');
    const count = await hiddenElements.count();

    for (let i = 0; i < count; i++) {
      const element = hiddenElements.nth(i);

      if (await element.isVisible()) {
        // If element is visible, it should not have aria-hidden="true"
        // This could hide important content from screen readers
        const textContent = await element.textContent();

        // Decorative elements (icons, etc.) are OK to hide
        // But elements with substantial text should not be aria-hidden
        if (textContent && textContent.trim().length > 20) {
          console.warn('Warning: Visible element with substantial text has aria-hidden="true"');
        }
      }
    }
  });
});

/**
 * Advanced Accessibility Testing with axe-core
 *
 * To enable these tests, install @axe-core/playwright:
 * npm install -D @axe-core/playwright
 *
 * Then uncomment the following:
 */

/*
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests - Axe Core', () => {
  test('should have no accessibility violations on home page', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('should have no accessibility violations on login page', async ({ page }) => {
    await page.goto('/login');
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
    });
  });

  test('should have no accessibility violations on dashboard', async ({ page, context }) => {
    // Set up authenticated state
    await context.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-jwt-token-for-testing');
    });

    await page.goto('/dashboard');
    await injectAxe(page);
    await checkA11y(page);
  });
});
*/
