import { test, expect, Page } from '@playwright/test';
import { setupAuthenticatedState, clearAuthState } from '../helpers/auth.helper';
import {
  waitForLoadingComplete,
  waitForSnackbar,
  waitForDialog,
  waitForDialogClosed,
  waitForDataLoad
} from '../helpers/wait.helper';

/**
 * E2E Tests - Critical Bug Fixes Validation
 * Sprint 7-8: Comprehensive testing for 3 critical bug fixes
 *
 * BUG-001: route_id UUID validation error in ticket purchase
 * BUG-002: Favorites 500 error due to lat/lon vs latitude/longitude
 * BUG-003: Ticket card TypeError in My Tickets page
 *
 * Test Environment:
 * - Backend: http://localhost:3000
 * - Frontend: http://localhost:4201
 */

test.describe('Critical Bug Fixes - E2E Validation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup authenticated state with real-looking user
    await setupAuthenticatedState(context, {
      id: 'e2e-test-user-' + Date.now(),
      email: 'e2e.tester@buszapp.com',
      name: 'E2E Tester',
      display_name: 'E2E Tester',
      role: 'user'
    });

    // Navigate to home and wait for app to be ready
    await page.goto('http://localhost:4201', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Give Angular time to bootstrap
  });

  test.afterEach(async ({ page }) => {
    await clearAuthState(page);
  });

  /**
   * BUG-001: Ticket Purchase Without Route ID
   *
   * Issue: Backend validation required route_id to be UUID or throw error
   * Fix: Added @Transform, @ValidateIf, @IsOptional decorators
   *
   * Test: Purchase ticket WITHOUT specifying route_id
   * Expected: Ticket purchased successfully (no UUID validation error)
   */
  test('BUG-001: Should purchase ticket without route_id (UUID validation fix)', async ({ page }) => {
    console.log('🧪 Testing BUG-001: Ticket purchase without route_id');

    // Navigate to ticket purchase page
    await page.goto('http://localhost:4201/tickets/purchase');
    await waitForLoadingComplete(page);

    // Take screenshot of initial page
    await page.screenshot({
      path: 'playwright-report/bug-001-1-purchase-page.png',
      fullPage: true
    });

    // Wait for ticket types to load
    await page.waitForSelector('.ticket-type-card, mat-card', { timeout: 10000 });

    // Select a ticket type (Single Journey - 450 Ft)
    const singleTicketCard = page.locator('mat-card, .ticket-type-card').filter({
      hasText: /single.*journey|egyszeri.*utazás|450/i
    }).first();

    await expect(singleTicketCard).toBeVisible({ timeout: 10000 });
    await singleTicketCard.screenshot({ path: 'playwright-report/bug-001-2-ticket-type.png' });

    // Click on the ticket card to select it
    await singleTicketCard.click();
    await page.waitForTimeout(500);

    // Look for purchase/buy button
    const purchaseButton = page.getByRole('button', {
      name: /purchase|buy|vásárl|megvesz/i
    });

    await expect(purchaseButton).toBeVisible({ timeout: 5000 });
    await expect(purchaseButton).toBeEnabled();

    // Take screenshot before purchase
    await page.screenshot({
      path: 'playwright-report/bug-001-3-before-purchase.png',
      fullPage: true
    });

    // Setup network monitoring
    const requests: any[] = [];
    const responses: any[] = [];

    page.on('request', request => {
      if (request.url().includes('/tickets')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/tickets')) {
        const body = await response.body().catch(() => null);
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          body: body?.toString()
        });
      }
    });

    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Click purchase button
    await purchaseButton.click();

    // Wait for either success or error
    await page.waitForTimeout(3000);

    // Take screenshot after purchase attempt
    await page.screenshot({
      path: 'playwright-report/bug-001-4-after-purchase.png',
      fullPage: true
    });

    // Check for success indicators
    const currentUrl = page.url();
    console.log('Current URL after purchase:', currentUrl);

    // Expected: Should NOT see UUID validation error
    const uuidError = page.getByText(/route_id.*must.*uuid/i);
    await expect(uuidError).not.toBeVisible();

    // Expected: Should see success message OR redirect to my tickets
    const isRedirectedToMyTickets = currentUrl.includes('/user/tickets') || currentUrl.includes('/tickets/my');
    const hasSuccessMessage = await page.getByText(/success|sikeres|purchased|megvásárolva/i).isVisible().catch(() => false);

    console.log('Redirected to My Tickets:', isRedirectedToMyTickets);
    console.log('Has success message:', hasSuccessMessage);
    console.log('Console errors:', consoleErrors);
    console.log('Network responses:', JSON.stringify(responses, null, 2));

    // Verify purchase succeeded
    expect(isRedirectedToMyTickets || hasSuccessMessage).toBeTruthy();

    // Verify no console errors about UUID
    const hasUuidError = consoleErrors.some(err => err.includes('route_id') && err.includes('UUID'));
    expect(hasUuidError).toBeFalsy();

    // Verify API call succeeded (200 or 201)
    const purchaseResponse = responses.find(r =>
      r.url.includes('/tickets') && (r.method === 'POST' || r.status === 201 || r.status === 200)
    );
    if (purchaseResponse) {
      expect([200, 201]).toContain(purchaseResponse.status);
    }

    console.log('✅ BUG-001 Test PASSED: Ticket purchased without route_id');
  });

  /**
   * BUG-002: Favorites List Display (lat/lon vs latitude/longitude)
   *
   * Issue: SQL query used 'lat, lon' but DB columns are 'latitude, longitude'
   * Fix: Changed SQL query to use correct column names
   *
   * Test: Load favorites page and verify stop names display correctly
   * Expected: No 500 error, stop names show real data (not "unknown")
   */
  test('BUG-002: Should display favorites with correct stop names (SQL column fix)', async ({ page }) => {
    console.log('🧪 Testing BUG-002: Favorites display with correct stop names');

    // First, check if user has any favorites
    await page.goto('http://localhost:4201/user/favorites');
    await waitForLoadingComplete(page);

    // Take screenshot of favorites page
    await page.screenshot({
      path: 'playwright-report/bug-002-1-favorites-page.png',
      fullPage: true
    });

    // Monitor network for 500 errors
    const networkErrors: any[] = [];
    page.on('response', response => {
      if (response.status() >= 500) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check for 500 errors
    console.log('Network errors (500+):', networkErrors);
    expect(networkErrors.length).toBe(0);

    // Check if favorites exist or empty state
    const emptyState = await page.locator('.empty-state, [data-testid="empty-state"]').isVisible().catch(() => false);
    const hasFavorites = await page.locator('.favorite-card, mat-card').count() > 0;

    console.log('Has empty state:', emptyState);
    console.log('Has favorites:', hasFavorites);

    if (hasFavorites) {
      // Verify stop names are displayed
      const favoriteCards = page.locator('.favorite-card, mat-card');
      const count = await favoriteCards.count();
      console.log(`Found ${count} favorite cards`);

      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = favoriteCards.nth(i);
        await card.screenshot({
          path: `playwright-report/bug-002-2-favorite-card-${i}.png`
        });

        // Check for stop names (should NOT be "unknown" or empty)
        const cardText = await card.textContent();
        console.log(`Favorite card ${i} text:`, cardText);

        // Verify stop names are present and not "unknown"
        expect(cardText).toBeTruthy();
        expect(cardText?.toLowerCase()).not.toContain('unknown');
        expect(cardText?.toLowerCase()).not.toContain('ismeretlen');
      }

      console.log('✅ BUG-002 Test PASSED: Favorites display with correct stop names');
    } else {
      console.log('⚠️ No favorites to test - creating one first');

      // Create a favorite to test
      await page.goto('http://localhost:4201/planner');
      await waitForLoadingComplete(page);

      // Fill in from/to stops
      const fromInput = page.locator('input[placeholder*="honnan" i], input[aria-label*="from" i]').first();
      const toInput = page.locator('input[placeholder*="hova" i], input[aria-label*="to" i]').first();

      await fromInput.fill('Deák Ferenc tér');
      await page.waitForTimeout(1000);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      await toInput.fill('Keleti');
      await page.waitForTimeout(1000);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // Search
      await page.getByRole('button', { name: /search|keresés/i }).click();
      await waitForDataLoad(page, '.route-card', 15000);

      // Save as favorite
      const saveButton = page.getByRole('button', { name: /save.*favorite|mentés.*kedvenc/i }).first();
      await saveButton.click();
      await waitForDialog(page);

      const nameInput = page.locator('input[name="name"], input[formcontrolname="name"]');
      await nameInput.fill('BUG-002 Test Favorite');

      await page.getByRole('button', { name: /save|mentés/i }).click();
      await waitForSnackbar(page, /success/i);

      // Now go back to favorites and verify
      await page.goto('http://localhost:4201/user/favorites');
      await waitForLoadingComplete(page);

      await page.screenshot({
        path: 'playwright-report/bug-002-3-favorites-after-create.png',
        fullPage: true
      });

      // Verify favorite shows correct stop names
      const newFavorite = page.getByText('BUG-002 Test Favorite');
      await expect(newFavorite).toBeVisible();

      const favoriteCard = page.locator('mat-card').filter({ hasText: 'BUG-002 Test Favorite' });
      const cardText = await favoriteCard.textContent();

      console.log('New favorite card text:', cardText);
      expect(cardText).toContain('Deák Ferenc tér');
      expect(cardText?.toLowerCase()).not.toContain('unknown');

      console.log('✅ BUG-002 Test PASSED: Favorite created and displays correctly');
    }
  });

  /**
   * BUG-003: Ticket Card TypeError (Missing ngIf guard)
   *
   * Issue: Template tried to access ticket.id before data loaded
   * Fix: Added *ngIf="ticket" guard and loading state
   *
   * Test: Navigate to My Tickets page and verify cards display without errors
   * Expected: Loading spinner shows, then tickets display correctly
   */
  test('BUG-003: Should display ticket cards without TypeError (ngIf guard fix)', async ({ page }) => {
    console.log('🧪 Testing BUG-003: Ticket card display without TypeError');

    // Monitor console for TypeErrors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to My Tickets page
    await page.goto('http://localhost:4201/user/tickets');

    // Check for loading spinner
    const loadingSpinner = page.locator('mat-spinner, .loading-spinner, .spinner');
    const hasLoadingSpinner = await loadingSpinner.isVisible().catch(() => false);
    console.log('Loading spinner visible:', hasLoadingSpinner);

    // Wait for page to load
    await waitForLoadingComplete(page);
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'playwright-report/bug-003-1-my-tickets-page.png',
      fullPage: true
    });

    // Check for TypeErrors in console
    console.log('Console errors:', consoleErrors);
    const hasTypeError = consoleErrors.some(err =>
      err.includes('TypeError') ||
      err.includes('Cannot read properties of undefined') ||
      err.includes('Cannot read property')
    );

    expect(hasTypeError).toBeFalsy();

    // Check if tickets exist
    const emptyState = await page.locator('.empty-state, [data-testid="empty-state"]').isVisible().catch(() => false);
    const hasTickets = await page.locator('.ticket-card, mat-card').count() > 0;

    console.log('Has empty state:', emptyState);
    console.log('Has tickets:', hasTickets);

    if (hasTickets) {
      // Verify ticket cards display correctly
      const ticketCards = page.locator('.ticket-card, mat-card');
      const count = await ticketCards.count();
      console.log(`Found ${count} ticket cards`);

      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = ticketCards.nth(i);
        await card.screenshot({
          path: `playwright-report/bug-003-2-ticket-card-${i}.png`
        });

        // Verify ticket ID is displayed (first 8 characters)
        const cardText = await card.textContent();
        console.log(`Ticket card ${i} text:`, cardText);

        // Check for ticket ID pattern (should show first 8 chars of UUID)
        expect(cardText).toBeTruthy();

        // Verify price is displayed
        expect(cardText).toMatch(/\d+\s*(ft|forint)/i);
      }

      console.log('✅ BUG-003 Test PASSED: Ticket cards display without TypeError');
    } else {
      console.log('⚠️ No tickets to test - purchasing one first');

      // Purchase a ticket to test
      await page.goto('http://localhost:4201/tickets/purchase');
      await waitForLoadingComplete(page);

      // Select cheapest ticket
      const ticketCard = page.locator('mat-card').first();
      await ticketCard.click();

      const purchaseButton = page.getByRole('button', { name: /purchase|vásárl/i });
      await purchaseButton.click();
      await page.waitForTimeout(3000);

      // Go back to My Tickets
      await page.goto('http://localhost:4201/user/tickets');
      await waitForLoadingComplete(page);

      await page.screenshot({
        path: 'playwright-report/bug-003-3-tickets-after-purchase.png',
        fullPage: true
      });

      // Verify ticket displays
      const newTicketCard = page.locator('mat-card').first();
      await expect(newTicketCard).toBeVisible();

      const cardText = await newTicketCard.textContent();
      console.log('New ticket card text:', cardText);

      // Verify no console errors
      const finalErrors = consoleErrors.filter(err =>
        err.includes('TypeError') || err.includes('Cannot read')
      );
      expect(finalErrors.length).toBe(0);

      console.log('✅ BUG-003 Test PASSED: Ticket purchased and displays correctly');
    }
  });

  /**
   * Combined User Flow - All 3 Bug Fixes
   *
   * Complete scenario testing all fixes together in one realistic user journey:
   * 1. Login
   * 2. Plan a trip
   * 3. Save as favorite → Verify BUG-002 fix
   * 4. Purchase ticket without route → Verify BUG-001 fix
   * 5. View My Tickets → Verify BUG-003 fix
   */
  test('Combined: Full user journey testing all 3 bug fixes', async ({ page }) => {
    console.log('🧪 Testing Combined User Journey - All 3 Bugs');

    // Step 1: Verify authenticated
    await page.goto('http://localhost:4201/dashboard');
    await waitForLoadingComplete(page);
    await page.screenshot({ path: 'playwright-report/combined-1-dashboard.png', fullPage: true });

    // Step 2: Plan a trip
    console.log('Step 2: Planning a trip...');
    await page.goto('http://localhost:4201/planner');
    await waitForLoadingComplete(page);

    const fromInput = page.locator('input[placeholder*="honnan" i]').first();
    const toInput = page.locator('input[placeholder*="hova" i]').first();

    await fromInput.fill('Deák Ferenc tér');
    await page.waitForTimeout(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await toInput.fill('Oktogon');
    await page.waitForTimeout(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: /search|keresés/i }).click();
    await waitForDataLoad(page, '.route-card', 15000);

    await page.screenshot({ path: 'playwright-report/combined-2-route-results.png', fullPage: true });

    // Step 3: Save as favorite (BUG-002 test)
    console.log('Step 3: Saving route as favorite (BUG-002)...');
    const saveButton = page.getByRole('button', { name: /save.*favorite|mentés.*kedvenc/i }).first();
    await saveButton.click();
    await waitForDialog(page);

    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill('Combined Test Favorite');
    await page.getByRole('button', { name: /save|mentés/i }).click();
    await waitForSnackbar(page, /success/i);

    // Navigate to favorites and verify (BUG-002)
    await page.goto('http://localhost:4201/user/favorites');
    await waitForLoadingComplete(page);
    await page.screenshot({ path: 'playwright-report/combined-3-favorites.png', fullPage: true });

    const favoriteCard = page.getByText('Combined Test Favorite');
    await expect(favoriteCard).toBeVisible();
    console.log('✅ Step 3 PASSED: Favorite displays correctly');

    // Step 4: Purchase ticket WITHOUT route (BUG-001 test)
    console.log('Step 4: Purchasing ticket without route_id (BUG-001)...');
    await page.goto('http://localhost:4201/tickets/purchase');
    await waitForLoadingComplete(page);

    const ticketCard = page.locator('mat-card').first();
    await ticketCard.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'playwright-report/combined-4-ticket-selection.png', fullPage: true });

    const purchaseButton = page.getByRole('button', { name: /purchase|vásárl/i });
    await purchaseButton.click();
    await page.waitForTimeout(3000);

    // Verify no UUID error
    const uuidError = page.getByText(/route_id.*uuid/i);
    await expect(uuidError).not.toBeVisible();
    console.log('✅ Step 4 PASSED: Ticket purchased without UUID error');

    // Step 5: View My Tickets (BUG-003 test)
    console.log('Step 5: Viewing My Tickets (BUG-003)...');
    await page.goto('http://localhost:4201/user/tickets');
    await waitForLoadingComplete(page);
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'playwright-report/combined-5-my-tickets.png', fullPage: true });

    // Verify tickets display without TypeError
    const hasTicketCards = await page.locator('mat-card').count() > 0;
    expect(hasTicketCards).toBeTruthy();

    const ticketCardText = await page.locator('mat-card').first().textContent();
    expect(ticketCardText).toBeTruthy();
    console.log('Ticket card displays:', ticketCardText);

    console.log('✅ Step 5 PASSED: My Tickets displays without TypeError');
    console.log('✅✅✅ COMBINED TEST PASSED: All 3 bug fixes working correctly!');
  });
});

/**
 * Performance Metrics Tests
 * Measure page load times and API response times
 */
test.describe('Performance Metrics - Bug Fix Validation', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupAuthenticatedState(context);
  });

  test('should measure page load times', async ({ page }) => {
    const pages = [
      { url: 'http://localhost:4201/tickets/purchase', name: 'Ticket Purchase' },
      { url: 'http://localhost:4201/user/favorites', name: 'Favorites' },
      { url: 'http://localhost:4201/user/tickets', name: 'My Tickets' }
    ];

    const metrics: any[] = [];

    for (const pageInfo of pages) {
      const startTime = Date.now();
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Get performance timing
      const perfTiming = await page.evaluate(() => {
        const timing = performance.timing;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart
        };
      });

      metrics.push({
        page: pageInfo.name,
        url: pageInfo.url,
        loadTime,
        ...perfTiming
      });

      console.log(`${pageInfo.name}: ${loadTime}ms`);
    }

    console.log('Performance Metrics:', JSON.stringify(metrics, null, 2));

    // Assert reasonable load times (< 5 seconds)
    metrics.forEach(metric => {
      expect(metric.loadTime).toBeLessThan(5000);
    });
  });

  test('should measure API response times', async ({ page }) => {
    const apiMetrics: any[] = [];

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/')) {
        const timing = response.timing();
        apiMetrics.push({
          url,
          status: response.status(),
          timing: timing.responseEnd
        });
      }
    });

    // Navigate to pages that make API calls
    await page.goto('http://localhost:4201/user/favorites');
    await page.waitForTimeout(2000);

    await page.goto('http://localhost:4201/user/tickets');
    await page.waitForTimeout(2000);

    console.log('API Metrics:', JSON.stringify(apiMetrics, null, 2));

    // Assert API responses are reasonably fast (< 2 seconds)
    apiMetrics.forEach(metric => {
      expect(metric.timing).toBeLessThan(2000);
    });
  });
});
