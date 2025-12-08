import { test, expect } from '@playwright/test';
import { setupAuthenticatedState, getCurrentUser } from '../helpers/auth.helper';
import {
  waitForLoadingComplete,
  waitForSnackbar,
  waitForDataLoad
} from '../helpers/wait.helper';

/**
 * E2E Tests - User Profile & Preferences Management
 * Sprint 9-10: Comprehensive tests for profile editing, notifications, and statistics
 */

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup authenticated state with specific user data
    await setupAuthenticatedState(context, {
      id: 'test-user-profile',
      email: 'profile.test@example.com',
      name: 'Profile Test User',
      display_name: 'Profile Tester'
    });

    // Mock profile API
    await page.route('**/api/users/profile', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          json: {
            id: 'test-user-profile',
            email: 'profile.test@example.com',
            name: 'Profile Test User',
            display_name: 'Profile Tester',
            preferred_language: 'en',
            notification_preferences: {
              emailTicketPurchase: true,
              emailRouteDisruptions: false,
              emailPromotional: false,
              pushNotifications: false
            },
            created_at: '2025-01-01T00:00:00Z',
            last_login_at: '2025-01-13T10:00:00Z'
          }
        });
      } else if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        route.fulfill({
          json: {
            id: 'test-user-profile',
            email: 'profile.test@example.com',
            ...body,
            updated_at: new Date().toISOString()
          }
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/profile');
    await waitForLoadingComplete(page);
  });

  test('should display profile page with tabs', async ({ page }) => {
    // Check page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /profile|profil/i })).toBeVisible();

    // Check tabs are visible
    await expect(page.getByRole('tab', { name: /profile|profil/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /notification|értesítés/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /statistics|statisztika/i })).toBeVisible();
  });

  test('should update display name with auto-save', async ({ page }) => {
    // Ensure we're on Profile tab
    const profileTab = page.getByRole('tab', { name: /^profile|^profil/i }).first();
    await profileTab.click();

    // Find display name input
    const displayNameInput = page.locator('input[formcontrolname="displayName"], input[name="displayName"]');
    await displayNameInput.waitFor({ state: 'visible' });

    // Clear and type new name
    await displayNameInput.clear();
    await displayNameInput.fill('Updated Test Name');

    // Wait for auto-save (debounced 2 seconds)
    await page.waitForTimeout(2500);

    // Should show save success indicator
    await expect(page.getByText(/saved|mentve/i)).toBeVisible({ timeout: 3000 });

    // Reload page and verify persistence
    await page.reload();
    await waitForLoadingComplete(page);

    await expect(displayNameInput).toHaveValue('Updated Test Name');
  });

  test('should change language preference', async ({ page }) => {
    // Ensure we're on Profile tab
    const profileTab = page.getByRole('tab', { name: /^profile|^profil/i }).first();
    await profileTab.click();

    // Find language selector
    const languageSelect = page.locator('mat-select[formcontrolname="preferredLanguage"], select[name="preferredLanguage"]');
    await languageSelect.click();

    // Select Hungarian
    const hungarianOption = page.getByRole('option', { name: /magyar|hungarian/i });
    await hungarianOption.click();

    // Wait for auto-save
    await page.waitForTimeout(2500);

    // Verify save indicator
    await expect(page.getByText(/saved|mentve/i)).toBeVisible({ timeout: 3000 });

    // Verify selection persists
    const selectedValue = await languageSelect.textContent();
    expect(selectedValue).toMatch(/magyar|hungarian/i);
  });

  test('should display account information', async ({ page }) => {
    // On Profile tab
    const profileTab = page.getByRole('tab', { name: /^profile|^profil/i }).first();
    await profileTab.click();

    // Check email is displayed (read-only)
    await expect(page.getByText('profile.test@example.com')).toBeVisible();

    // Check member since date
    await expect(page.getByText(/member since|tag óta/i)).toBeVisible();
    await expect(page.getByText(/2025/)).toBeVisible();

    // Check last login
    await expect(page.getByText(/last login|utolsó bejelentkezés/i)).toBeVisible();
  });

  test('should validate display name length', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /^profile|^profil/i }).first();
    await profileTab.click();

    const displayNameInput = page.locator('input[formcontrolname="displayName"]');

    // Try empty name
    await displayNameInput.clear();
    await displayNameInput.blur();

    // Should show validation error
    await expect(page.getByText(/required|kötelező/i)).toBeVisible();

    // Try name longer than 50 characters
    await displayNameInput.fill('A'.repeat(51));

    // Should prevent typing or show error
    const value = await displayNameInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(50);

    // Valid name should clear errors
    await displayNameInput.clear();
    await displayNameInput.fill('Valid Name');
    await page.waitForTimeout(500);

    await expect(page.getByText(/required|kötelező/i)).not.toBeVisible();
  });
});

test.describe('Notification Preferences', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupAuthenticatedState(context);

    // Mock notification preferences API
    await page.route('**/api/users/notification-preferences', (route) => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        route.fulfill({
          json: {
            notification_preferences: body
          }
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/users/profile', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          json: {
            id: 'test-user',
            email: 'test@example.com',
            notification_preferences: {
              emailTicketPurchase: true,
              emailRouteDisruptions: false,
              emailPromotional: false,
              pushNotifications: false
            }
          }
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/profile');
    await waitForLoadingComplete(page);

    // Navigate to Notifications tab
    const notificationTab = page.getByRole('tab', { name: /notification|értesítés/i });
    await notificationTab.click();
    await page.waitForTimeout(500);
  });

  test('should toggle email ticket purchase notifications', async ({ page }) => {
    // Find ticket purchase toggle
    const toggle = page.locator('mat-slide-toggle').filter({ hasText: /ticket purchase|jegy vásárlás/i });
    await toggle.waitFor({ state: 'visible' });

    // Get initial state
    const initialState = await toggle.getAttribute('class');
    const isChecked = initialState?.includes('mat-checked');

    // Click toggle
    await toggle.click();

    // Wait for auto-save
    await page.waitForTimeout(2500);

    // Verify state changed
    const newState = await toggle.getAttribute('class');
    const isNowChecked = newState?.includes('mat-checked');
    expect(isNowChecked).toBe(!isChecked);

    // Should show success message
    await expect(page.getByText(/saved|mentve|updated/i)).toBeVisible({ timeout: 3000 });
  });

  test('should toggle route disruption notifications', async ({ page }) => {
    const toggle = page.locator('mat-slide-toggle').filter({ hasText: /route disruption|útvonal változás/i });
    await toggle.click();

    await page.waitForTimeout(2500);
    await expect(page.getByText(/saved|mentve/i)).toBeVisible({ timeout: 3000 });
  });

  test('should toggle promotional emails', async ({ page }) => {
    const toggle = page.locator('mat-slide-toggle').filter({ hasText: /promotional|promóciós/i });
    await toggle.click();

    await page.waitForTimeout(2500);
    await expect(page.getByText(/saved|mentve/i)).toBeVisible({ timeout: 3000 });
  });

  test('should show push notifications as coming soon', async ({ page }) => {
    // Check that push notifications toggle is disabled
    const pushToggle = page.locator('mat-slide-toggle').filter({ hasText: /push notification/i });
    await expect(pushToggle).toBeDisabled();

    // Should have "Coming Soon" badge
    await expect(page.getByText(/coming soon|hamarosan/i)).toBeVisible();
  });

  test('should display GDPR compliance notice', async ({ page }) => {
    // Check for privacy policy mention
    await expect(page.getByText(/privacy|adatvédelem/i)).toBeVisible();

    // Should have link to privacy policy
    const privacyLink = page.getByRole('link', { name: /privacy policy|adatvédelmi szabályzat/i });
    await expect(privacyLink).toBeVisible();
  });

  test('should revert on save error', async ({ page }) => {
    // Mock API error
    await page.route('**/api/users/notification-preferences', (route) => {
      route.fulfill({
        status: 500,
        json: { message: 'Failed to save preferences' }
      });
    });

    const toggle = page.locator('mat-slide-toggle').filter({ hasText: /ticket purchase/i });
    const initialClass = await toggle.getAttribute('class');

    // Click toggle
    await toggle.click();

    // Wait for error
    await page.waitForTimeout(2500);

    // Should show error message
    await expect(page.getByText(/error|hiba|failed/i)).toBeVisible();

    // Should revert to original state
    const finalClass = await toggle.getAttribute('class');
    expect(finalClass).toBe(initialClass);
  });
});

test.describe('Account Statistics', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupAuthenticatedState(context);

    // Mock statistics API
    await page.route('**/api/users/statistics', (route) => {
      route.fulfill({
        json: {
          total_tickets_purchased: 42,
          active_tickets_count: 5,
          total_amount_spent: 25000, // HUF
          favorites_count: 8,
          last_ticket_purchase: '2025-01-10T14:30:00Z',
          last_favorite_added: '2025-01-12T09:15:00Z'
        }
      });
    });

    await page.route('**/api/users/profile', (route) => {
      route.fulfill({
        json: {
          id: 'test-user',
          email: 'test@example.com'
        }
      });
    });

    await page.goto('/profile');
    await waitForLoadingComplete(page);

    // Navigate to Statistics tab
    const statisticsTab = page.getByRole('tab', { name: /statistics|statisztika/i });
    await statisticsTab.click();
    await page.waitForTimeout(500);
  });

  test('should display statistics cards', async ({ page }) => {
    // Wait for stats to load
    await waitForDataLoad(page, '.stat-card, [data-testid="stat-card"]', 5000);

    // Check all 4 stat cards are visible
    await expect(page.getByText(/42/)).toBeVisible(); // Total tickets
    await expect(page.getByText(/5/)).toBeVisible(); // Active tickets
    await expect(page.getByText(/25.*000|25,000/)).toBeVisible(); // Total spent
    await expect(page.getByText(/8/)).toBeVisible(); // Favorites count
  });

  test('should navigate to tickets when clicking tickets card', async ({ page }) => {
    await waitForDataLoad(page, '.stat-card', 5000);

    // Click on tickets purchased card
    const ticketsCard = page.locator('.stat-card').filter({ hasText: /tickets purchased|jegyek vásárolva/i });
    await ticketsCard.click();

    // Should navigate to My Tickets
    await expect(page).toHaveURL(/.*tickets\/my-tickets/);
  });

  test('should navigate to favorites when clicking favorites card', async ({ page }) => {
    await waitForDataLoad(page, '.stat-card', 5000);

    // Click on favorites card
    const favoritesCard = page.locator('.stat-card').filter({ hasText: /saved favorites|mentett kedvencek/i });
    await favoritesCard.click();

    // Should navigate to Favorites
    await expect(page).toHaveURL(/.*favorites/);
  });

  test('should display quick actions', async ({ page }) => {
    await waitForDataLoad(page, '.stat-card', 5000);

    // Check quick action buttons
    await expect(page.getByRole('button', { name: /buy.*ticket|jegy vásárlás/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /plan.*trip|útvonal tervezés/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /view.*tickets|jegyek megtekintése/i })).toBeVisible();
  });

  test('should handle statistics loading error', async ({ page }) => {
    // Navigate to fresh page with error mock
    await page.route('**/api/users/statistics', (route) => {
      route.fulfill({
        status: 500,
        json: { message: 'Failed to load statistics' }
      });
    });

    await page.goto('/profile?tab=statistics');
    await waitForLoadingComplete(page);

    // Should show error message
    await expect(page.getByText(/error|hiba|failed/i)).toBeVisible();

    // Should have retry button
    const retryButton = page.getByRole('button', { name: /retry|újra/i });
    await expect(retryButton).toBeVisible();
  });

  test('should show skeleton loading state', async ({ page }) => {
    // Navigate to fresh page (should see loading)
    const newPage = await page.context().newPage();
    await setupAuthenticatedState(newPage.context());

    // Delay API response to see loading state
    await newPage.route('**/api/users/statistics', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.fulfill({
        json: {
          total_tickets_purchased: 0,
          active_tickets_count: 0,
          total_amount_spent: 0,
          favorites_count: 0
        }
      });
    });

    await newPage.goto('/profile?tab=statistics');

    // Should show skeleton loaders
    const skeleton = newPage.locator('.skeleton, mat-skeleton');
    await expect(skeleton).toBeVisible({ timeout: 1000 });

    await newPage.close();
  });
});

test.describe('Profile - Tab Navigation', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupAuthenticatedState(context);
    await page.route('**/api/users/**', (route) => {
      route.fulfill({ json: {} });
    });
  });

  test('should support tab query parameter', async ({ page }) => {
    // Navigate directly to notifications tab via URL
    await page.goto('/profile?tab=notifications');
    await waitForLoadingComplete(page);

    // Notifications tab should be active
    const notificationsTab = page.getByRole('tab', { name: /notification/i });
    const isActive = await notificationsTab.getAttribute('aria-selected');
    expect(isActive).toBe('true');
  });

  test('should update URL when switching tabs', async ({ page }) => {
    await page.goto('/profile');
    await waitForLoadingComplete(page);

    // Click Statistics tab
    const statisticsTab = page.getByRole('tab', { name: /statistics/i });
    await statisticsTab.click();

    // URL should update
    await expect(page).toHaveURL(/.*tab=statistics/);

    // Click back to Profile tab
    const profileTab = page.getByRole('tab', { name: /^profile/i }).first();
    await profileTab.click();

    // URL should update
    await expect(page).toHaveURL(/.*tab=profile/);
  });

  test('should persist tab selection on page refresh', async ({ page }) => {
    await page.goto('/profile?tab=notifications');
    await waitForLoadingComplete(page);

    // Reload page
    await page.reload();
    await waitForLoadingComplete(page);

    // Should still be on notifications tab
    const notificationsTab = page.getByRole('tab', { name: /notification/i });
    const isActive = await notificationsTab.getAttribute('aria-selected');
    expect(isActive).toBe('true');
  });
});

test.describe('Profile - Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupAuthenticatedState(context);
    await page.route('**/api/users/**', (route) => {
      route.fulfill({ json: {} });
    });
    await page.goto('/profile');
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through all interactive elements
    await page.keyboard.press('Tab');

    // Should be able to navigate between tabs with arrow keys
    const profileTab = page.getByRole('tab', { name: /^profile/i }).first();
    await profileTab.focus();
    await page.keyboard.press('ArrowRight');

    // Should move to next tab
    const notificationsTab = page.getByRole('tab', { name: /notification/i });
    const isFocused = await notificationsTab.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBeTruthy();
  });

  test('should have proper ARIA labels on form controls', async ({ page }) => {
    const inputs = await page.locator('input, mat-slide-toggle').all();

    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');

      // Should have label or aria-label
      if (!ariaLabel && !ariaLabelledBy) {
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label).toBeGreaterThan(0);
      }
    }
  });

  test('should announce save status to screen readers', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /^profile/i }).first();
    await profileTab.click();

    const displayNameInput = page.locator('input[formcontrolname="displayName"]');
    await displayNameInput.clear();
    await displayNameInput.fill('New Name');

    await page.waitForTimeout(2500);

    // Check for status announcement
    const statusRegion = page.locator('[role="status"], [aria-live="polite"]');
    await expect(statusRegion).toBeVisible();
  });
});

test.describe('Profile - Responsive Design', () => {
  test('should display correctly on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupAuthenticatedState(context);
    await page.route('**/api/users/**', (route) => {
      route.fulfill({ json: {} });
    });

    await page.goto('/profile');
    await waitForLoadingComplete(page);

    // Tabs should show icons only on mobile
    const tabs = page.locator('mat-tab-label');
    const firstTabWidth = await tabs.first().boundingBox();

    expect(firstTabWidth?.width).toBeLessThan(100); // Icons are narrow
  });

  test('should display stat cards in column on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupAuthenticatedState(context);

    await page.route('**/api/users/statistics', (route) => {
      route.fulfill({ json: { total_tickets_purchased: 10 } });
    });

    await page.goto('/profile?tab=statistics');
    await waitForLoadingComplete(page);

    const statCards = page.locator('.stat-card');
    const count = await statCards.count();

    if (count > 1) {
      const first = await statCards.nth(0).boundingBox();
      const second = await statCards.nth(1).boundingBox();

      // Cards should be stacked (second card below first)
      expect(second?.y).toBeGreaterThan(first!.y + first!.height);
    }
  });
});
