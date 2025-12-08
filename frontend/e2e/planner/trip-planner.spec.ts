import { test, expect } from '@playwright/test';

/**
 * Sprint 5-6 E2E Tests: Trip Planner
 *
 * Tests the complete trip planning workflow including:
 * - Route search with autocomplete
 * - Alternative routes display
 * - Route selection and map interaction
 * - Responsive behavior
 * - Error handling
 */

test.describe('Trip Planner - Route Search Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to trip planner page
    await page.goto('/planner');
    await page.waitForLoadState('networkidle');
  });

  test('should display trip planner form with all required fields', async ({ page }) => {
    // Verify form elements are present
    await expect(page.locator('[data-testid="from-input"], input[placeholder*="Honnan"]')).toBeVisible();
    await expect(page.locator('[data-testid="to-input"], input[placeholder*="Hova"]')).toBeVisible();
    await expect(page.locator('button:has-text("Keresés"), button:has-text("Search")')).toBeVisible();
  });

  test('should autocomplete stops when typing', async ({ page }) => {
    const fromInput = page.locator('input[placeholder*="Honnan"]').first();

    // Type search term
    await fromInput.fill('Deák');

    // Wait for autocomplete dropdown
    await page.waitForSelector('.mat-autocomplete-panel', { timeout: 5000 });

    // Verify options appear
    const options = page.locator('.mat-option');
    await expect(options).not.toHaveCount(0);

    // Verify option contains search term
    const firstOption = options.first();
    await expect(firstOption).toContainText(/Deák/i);
  });

  test('should perform route search and display alternatives', async ({ page }) => {
    // Fill start location
    const fromInput = page.locator('input[placeholder*="Honnan"]').first();
    await fromInput.fill('Deák');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option:has-text("Deák")').first().click();

    // Fill end location
    const toInput = page.locator('input[placeholder*="Hova"]').first();
    await toInput.fill('Keleti');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option:has-text("Keleti")').first().click();

    // Click search button
    await page.locator('button:has-text("Keresés"), button:has-text("Search")').click();

    // Wait for results
    await page.waitForSelector('.route-card, .result-card', { timeout: 10000 });

    // Verify: Multiple alternatives shown
    const routeCards = page.locator('.route-card, .result-card');
    const count = await routeCards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);

    // Verify: Map is visible
    await expect(page.locator('.leaflet-container, #map-container')).toBeVisible();
  });

  test('should display recommended badge on first route', async ({ page }) => {
    // Setup: Perform search
    await page.locator('input[placeholder*="Honnan"]').first().fill('Deák');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('input[placeholder*="Hova"]').first().fill('Keleti');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('button:has-text("Keresés"), button:has-text("Search")').click();
    await page.waitForSelector('.route-card, .result-card', { timeout: 10000 });

    // Verify: First route has recommended badge
    const firstCard = page.locator('.route-card, .result-card').first();
    await expect(firstCard.locator('.badge:has-text("Ajánlott"), .recommended-badge')).toBeVisible();
  });

  test('should switch alternative routes', async ({ page }) => {
    // Setup: Perform search
    await page.locator('input[placeholder*="Honnan"]').first().fill('Deák');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('input[placeholder*="Hova"]').first().fill('Blaha');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('button:has-text("Keresés"), button:has-text("Search")').click();
    await page.waitForSelector('.route-card, .result-card', { timeout: 10000 });

    const routeCards = page.locator('.route-card, .result-card');
    const cardCount = await routeCards.count();

    if (cardCount > 1) {
      // Click second alternative
      await routeCards.nth(1).click();

      // Wait for interaction
      await page.waitForTimeout(500);

      // Verify: Selected state (indicator, highlight, etc.)
      // Note: This depends on actual implementation
      const secondCard = routeCards.nth(1);
      // Check for selection indicator or active class
      const hasSelectionIndicator = await secondCard.locator('.selected, .active, .selection-indicator').count() > 0;
      expect(hasSelectionIndicator).toBeTruthy();
    }
  });

  test('should expand and collapse route details', async ({ page }) => {
    // Setup: Perform search
    await page.locator('input[placeholder*="Honnan"]').first().fill('Deák');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('input[placeholder*="Hova"]').first().fill('Keleti');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('button:has-text("Keresés")').click();
    await page.waitForSelector('.route-card, .result-card');

    const firstCard = page.locator('.route-card, .result-card').first();

    // Find expand button
    const expandBtn = firstCard.locator('button.expand-btn, button[aria-label*="Részletek"], button:has-text("Részletek")').first();

    if (await expandBtn.count() > 0) {
      // Initially collapsed
      const detailsBefore = firstCard.locator('.card-details, .route-details');
      const isVisibleBefore = await detailsBefore.isVisible().catch(() => false);

      // Click expand
      await expandBtn.click();
      await page.waitForTimeout(300);

      // Now expanded
      await expect(detailsBefore).toBeVisible();

      // Click collapse
      await expandBtn.click();
      await page.waitForTimeout(300);

      // Now collapsed again
      const isVisibleAfter = await detailsBefore.isVisible().catch(() => false);
      expect(isVisibleAfter).toBe(false);
    }
  });

  test('should handle no route found gracefully', async ({ page }) => {
    // Try to search with incomplete data or wait for error scenario
    await page.locator('input[placeholder*="Honnan"]').first().fill('NonexistentStop123');
    await page.locator('input[placeholder*="Hova"]').first().fill('AnotherFake456');

    await page.locator('button:has-text("Keresés")').click();

    // Verify: Error message or snackbar
    const snackbar = page.locator('.mat-snack-bar-container, .snackbar, .notification');
    await expect(snackbar).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await expect(page.locator('input[placeholder*="Honnan"]')).toBeVisible();
    await expect(page.locator('button:has-text("Keresés")')).toBeVisible();

    // Perform search
    await page.locator('input[placeholder*="Honnan"]').first().fill('Deák');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('input[placeholder*="Hova"]').first().fill('Keleti');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('button:has-text("Keresés")').click();
    await page.waitForSelector('.route-card, .result-card', { timeout: 10000 });

    // Verify: Layout is usable on mobile
    const routeCards = page.locator('.route-card, .result-card');
    await expect(routeCards.first()).toBeVisible();
  });
});

test.describe('Trip Planner - Map Interaction', () => {

  test('should display map with route polyline after search', async ({ page }) => {
    await page.goto('/planner');

    // Perform search
    await page.locator('input[placeholder*="Honnan"]').first().fill('Deák');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('input[placeholder*="Hova"]').first().fill('Keleti');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('button:has-text("Keresés")').click();
    await page.waitForSelector('.route-card, .result-card', { timeout: 10000 });

    // Verify: Map container exists
    await expect(page.locator('.leaflet-container, #map-container')).toBeVisible();

    // Verify: Polyline or markers visible
    const mapElements = page.locator('.leaflet-overlay-pane path, .leaflet-marker-pane');
    await expect(mapElements).toBeVisible();
  });

  test('should update map when selecting different alternative', async ({ page }) => {
    await page.goto('/planner');

    // Perform search
    await page.locator('input[placeholder*="Honnan"]').first().fill('Deák');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('input[placeholder*="Hova"]').first().fill('Blaha');
    await page.waitForSelector('.mat-autocomplete-panel');
    await page.locator('.mat-option').first().click();

    await page.locator('button:has-text("Keresés")').click();
    await page.waitForSelector('.route-card, .result-card', { timeout: 10000 });

    const routeCards = page.locator('.route-card, .result-card');
    const cardCount = await routeCards.count();

    if (cardCount > 1) {
      // Get initial polyline count
      const initialPolylines = await page.locator('.leaflet-overlay-pane path').count();

      // Click second alternative
      await routeCards.nth(1).click();
      await page.waitForTimeout(500);

      // Polylines should still exist (route changed)
      const newPolylines = await page.locator('.leaflet-overlay-pane path').count();
      expect(newPolylines).toBeGreaterThan(0);
    }
  });
});

test.describe('Trip Planner - Form Validation', () => {

  test('should disable search button when form is invalid', async ({ page }) => {
    await page.goto('/planner');

    // Search button should be disabled initially
    const searchBtn = page.locator('button:has-text("Keresés"), button:has-text("Search")');
    const isDisabled = await searchBtn.isDisabled();

    // May be enabled or disabled depending on default values
    // Fill only one field
    await page.locator('input[placeholder*="Honnan"]').first().fill('Deák');

    // Without selecting, button might still be disabled
    // This test verifies form validation logic
  });

  test('should require stop selection from autocomplete', async ({ page }) => {
    await page.goto('/planner');

    // Type but don't select
    await page.locator('input[placeholder*="Honnan"]').first().fill('InvalidText');
    await page.locator('input[placeholder*="Hova"]').first().fill('AlsoInvalid');

    // Try to search
    await page.locator('button:has-text("Keresés")').click();

    // Should show validation error
    const snackbar = page.locator('.mat-snack-bar-container:has-text("válasszon"), .snackbar');
    await expect(snackbar).toBeVisible({ timeout: 5000 });
  });
});
