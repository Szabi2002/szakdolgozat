import { test, expect } from '@playwright/test';
import { setupAuthenticatedState, clearAuthState } from '../helpers/auth.helper';
import {
  waitForLoadingComplete,
  waitForSnackbar,
  waitForDialog,
  waitForDialogClosed,
  waitForDataLoad
} from '../helpers/wait.helper';

/**
 * E2E Tests - Favorites Management
 * Sprint 9-10: Comprehensive tests for favorite routes CRUD operations
 */

test.describe('Favorites Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup authenticated state
    await setupAuthenticatedState(context);
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('should display favorites page', async ({ page }) => {
    // Navigate to favorites page
    await page.goto('/favorites');

    // Wait for page to load
    await waitForLoadingComplete(page);

    // Check page title/heading
    await expect(page.locator('h1, h2').filter({ hasText: /favorites|kedvencek/i })).toBeVisible();

    // Check for empty state or favorites list
    const emptyState = page.locator('.empty-state, [data-testid="empty-state"]');
    const favoritesList = page.locator('.favorites-list, [data-testid="favorites-list"]');

    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasList = await favoritesList.isVisible().catch(() => false);

    expect(hasEmptyState || hasList).toBeTruthy();
  });

  test('should create a new favorite', async ({ page }) => {
    // First, navigate to trip planner to create a route search
    await page.goto('/planner');
    await waitForLoadingComplete(page);

    // Fill in from and to stops
    const fromInput = page.locator('input[placeholder*="honnan" i], input[aria-label*="from" i]').first();
    const toInput = page.locator('input[placeholder*="hova" i], input[aria-label*="to" i]').first();

    await fromInput.fill('Deák Ferenc tér');
    await page.waitForTimeout(500); // Wait for autocomplete
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await toInput.fill('Keleti pályaudvar');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Click search button
    const searchButton = page.getByRole('button', { name: /keresés|search/i });
    await searchButton.click();

    // Wait for results
    await waitForDataLoad(page, '.route-card, [data-testid="route-card"]', 15000);

    // Click "Save as Favorite" button on first route card
    const saveButton = page.getByRole('button', { name: /save.*favorite|mentés.*kedvenc/i }).first();
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();

    // Wait for dialog to open
    const dialog = await waitForDialog(page);

    // Fill favorite name
    const nameInput = dialog.locator('input[formcontrolname="name"], input[name="name"]');
    await nameInput.fill('Morning Commute to Keleti');

    // Click save button in dialog
    const dialogSaveButton = dialog.getByRole('button', { name: /save|mentés/i });
    await dialogSaveButton.click();

    // Wait for success message
    await waitForSnackbar(page, /success|sikeres/i);
    await waitForDialogClosed(page);

    // Navigate to favorites page
    await page.goto('/favorites');
    await waitForLoadingComplete(page);

    // Verify favorite appears in list
    await expect(page.getByText('Morning Commute to Keleti')).toBeVisible();
  });

  test('should enforce 20 favorites limit', async ({ page, context }) => {
    // Mock API to return 20 existing favorites
    await page.route('**/api/favorites', (route) => {
      if (route.request().method() === 'GET') {
        // Return 20 favorites
        const favorites = Array.from({ length: 20 }, (_, i) => ({
          id: `favorite-${i}`,
          name: `Favorite Route ${i + 1}`,
          from_stop_id: `stop-from-${i}`,
          to_stop_id: `stop-to-${i}`,
          user_id: 'test-user-123e4567',
          created_at: new Date().toISOString()
        }));
        route.fulfill({ json: favorites });
      } else if (route.request().method() === 'POST') {
        // Simulate 20 favorites limit error
        route.fulfill({
          status: 400,
          json: {
            statusCode: 400,
            message: 'Maximum 20 favorites reached',
            error: 'Bad Request'
          }
        });
      } else {
        route.continue();
      }
    });

    // Navigate to planner and search for a route
    await page.goto('/planner');
    await waitForLoadingComplete(page);

    // Fill in stops (simplified)
    await page.locator('input[placeholder*="honnan" i]').first().fill('Deák Ferenc tér');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');

    await page.locator('input[placeholder*="hova" i]').first().fill('Keleti');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: /search/i }).click();
    await waitForDataLoad(page, '.route-card', 15000);

    // Try to save as favorite
    const saveButton = page.getByRole('button', { name: /save.*favorite/i }).first();

    // Button should be disabled or show tooltip
    const isDisabled = await saveButton.isDisabled();
    if (isDisabled) {
      // Hover to see tooltip
      await saveButton.hover();
      await expect(page.locator('.mat-tooltip, [role="tooltip"]')).toContainText(/20.*favorites/i);
    } else {
      // If button is clickable, it should show error message
      await saveButton.click();
      await waitForDialog(page);

      const dialog = page.locator('mat-dialog-container');
      await dialog.locator('input[name="name"]').fill('21st Favorite');
      await dialog.getByRole('button', { name: /save/i }).click();

      // Should show error message
      await waitForSnackbar(page, /maximum.*20/i, 10000);
    }
  });

  test('should edit favorite name', async ({ page }) => {
    // Mock API to return existing favorites
    await page.route('**/api/favorites', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          json: [{
            id: 'favorite-1',
            name: 'Home to Work',
            from_stop_id: 'stop-1',
            to_stop_id: 'stop-2',
            user_id: 'test-user-123e4567',
            created_at: new Date().toISOString()
          }]
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/favorites/*', (route) => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        route.fulfill({
          json: {
            id: 'favorite-1',
            name: body.name,
            from_stop_id: 'stop-1',
            to_stop_id: 'stop-2',
            user_id: 'test-user-123e4567',
            updated_at: new Date().toISOString()
          }
        });
      } else {
        route.continue();
      }
    });

    // Navigate to favorites
    await page.goto('/favorites');
    await waitForLoadingComplete(page);

    // Click edit button
    const editButton = page.getByRole('button', { name: /edit|szerkeszt/i }).first();
    await editButton.click();

    // Wait for edit dialog
    const dialog = await waitForDialog(page);

    // Change name
    const nameInput = dialog.locator('input[formcontrolname="name"], input[name="name"]');
    await nameInput.clear();
    await nameInput.fill('Morning Commute Updated');

    // Save
    await dialog.getByRole('button', { name: /save|mentés/i }).click();

    // Verify success
    await waitForSnackbar(page, /success|sikeres/i);
    await waitForDialogClosed(page);

    // Verify updated name appears
    await expect(page.getByText('Morning Commute Updated')).toBeVisible();
  });

  test('should delete favorite', async ({ page }) => {
    // Mock API
    await page.route('**/api/favorites', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          json: [{
            id: 'favorite-1',
            name: 'Home to Work',
            from_stop_id: 'stop-1',
            to_stop_id: 'stop-2',
            user_id: 'test-user-123e4567',
            created_at: new Date().toISOString()
          }]
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/favorites/*', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 });
      } else {
        route.continue();
      }
    });

    // Navigate to favorites
    await page.goto('/favorites');
    await waitForLoadingComplete(page);

    // Verify favorite exists
    await expect(page.getByText('Home to Work')).toBeVisible();

    // Click delete button
    const deleteButton = page.getByRole('button', { name: /delete|törlés/i }).first();
    await deleteButton.click();

    // Confirm deletion in dialog
    const confirmDialog = await waitForDialog(page);
    const confirmButton = confirmDialog.getByRole('button', { name: /confirm|delete|igen|törlés/i });
    await confirmButton.click();

    // Verify success message
    await waitForSnackbar(page, /deleted|törölve/i);
    await waitForDialogClosed(page);

    // Verify favorite removed from list
    await expect(page.getByText('Home to Work')).not.toBeVisible();
  });

  test('should use favorite to plan route', async ({ page }) => {
    // Mock API
    await page.route('**/api/favorites', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          json: [{
            id: 'favorite-1',
            name: 'Home to Work',
            from_stop_id: 'stop-deakferencter',
            to_stop_id: 'stop-keleti',
            route_data: {
              from_stop_name: 'Deák Ferenc tér',
              to_stop_name: 'Keleti pályaudvar'
            },
            user_id: 'test-user-123e4567',
            created_at: new Date().toISOString()
          }]
        });
      } else {
        route.continue();
      }
    });

    // Navigate to favorites
    await page.goto('/favorites');
    await waitForLoadingComplete(page);

    // Click on favorite card or "Use" button
    const useButton = page.getByRole('button', { name: /use|plan|használat/i }).first();
    await useButton.click();

    // Should navigate to trip planner
    await expect(page).toHaveURL(/.*planner/);

    // Verify stops are pre-filled
    const fromInput = page.locator('input[placeholder*="honnan" i]').first();
    const toInput = page.locator('input[placeholder*="hova" i]').first();

    await expect(fromInput).toHaveValue(/Deák Ferenc tér/i);
    await expect(toInput).toHaveValue(/Keleti/i);
  });

  test('should show empty state when no favorites', async ({ page }) => {
    // Mock empty favorites
    await page.route('**/api/favorites', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ json: [] });
      } else {
        route.continue();
      }
    });

    await page.goto('/favorites');
    await waitForLoadingComplete(page);

    // Check empty state
    const emptyState = page.locator('.empty-state, [data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();

    // Should have helpful message
    await expect(page.getByText(/no.*favorites|nincs.*kedvenc/i)).toBeVisible();

    // Should have link/button to trip planner
    const plannerLink = page.getByRole('link', { name: /plan.*trip|tervez/i });
    await expect(plannerLink).toBeVisible();
  });

  test('should validate favorite name length', async ({ page }) => {
    await page.goto('/planner');
    await waitForLoadingComplete(page);

    // Simplified route search
    await page.locator('input[placeholder*="honnan" i]').first().fill('Deák Ferenc tér');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');

    await page.locator('input[placeholder*="hova" i]').first().fill('Keleti');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: /search/i }).click();
    await waitForDataLoad(page, '.route-card', 15000);

    // Open save dialog
    await page.getByRole('button', { name: /save.*favorite/i }).first().click();
    const dialog = await waitForDialog(page);

    // Try to save with empty name
    const saveButton = dialog.getByRole('button', { name: /save|mentés/i });
    await expect(saveButton).toBeDisabled();

    // Try to save with name too short
    const nameInput = dialog.locator('input[name="name"]');
    await nameInput.fill('AB'); // Less than 3 characters
    await expect(saveButton).toBeDisabled();

    // Try to save with name too long (>100 characters)
    await nameInput.clear();
    await nameInput.fill('A'.repeat(101));

    // Should show validation error or prevent typing
    const value = await nameInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(100);

    // Valid name should enable save button
    await nameInput.clear();
    await nameInput.fill('Valid Favorite Name');
    await expect(saveButton).toBeEnabled();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/favorites', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 500,
          json: { message: 'Internal Server Error' }
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/favorites');
    await waitForLoadingComplete(page);

    // Should show error message
    await expect(page.getByText(/error|hiba/i)).toBeVisible();

    // Should have retry button
    const retryButton = page.getByRole('button', { name: /retry|újra/i });
    await expect(retryButton).toBeVisible();
  });
});

test.describe('Favorites - Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupAuthenticatedState(context);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/favorites');
    await waitForLoadingComplete(page);

    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Focus first element

    // All buttons should be focusable
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      const isFocusable = await button.evaluate((el) => el.tabIndex >= 0);
      expect(isFocusable).toBeTruthy();
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/favorites');
    await waitForLoadingComplete(page);

    // Check for aria-label on icon buttons
    const iconButtons = page.locator('button mat-icon').locator('..');
    const count = await iconButtons.count();

    for (let i = 0; i < count; i++) {
      const button = iconButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');

      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });
});

test.describe('Favorites - Responsive Design', () => {
  test('should display correctly on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await setupAuthenticatedState(context);

    await page.goto('/favorites');
    await waitForLoadingComplete(page);

    // Check mobile layout
    const container = page.locator('.favorites-container, main');
    const width = await container.boundingBox();

    expect(width?.width).toBeLessThanOrEqual(375);
  });

  test('should display correctly on tablet', async ({ page, context }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await setupAuthenticatedState(context);

    await page.goto('/favorites');
    await waitForLoadingComplete(page);

    // Verify responsive grid
    const grid = page.locator('.favorites-grid, .favorites-list');
    await expect(grid).toBeVisible();
  });
});
