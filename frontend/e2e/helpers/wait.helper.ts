import { Page, Locator } from '@playwright/test';

/**
 * E2E Test Helpers - Wait Utilities
 * Sprint 9-10: Helper functions for waiting on various conditions
 */

/**
 * Wait for loading spinner to disappear
 */
export async function waitForLoadingComplete(page: Page, timeout = 10000): Promise<void> {
  const spinner = page.locator('mat-spinner, mat-progress-bar, .loading-spinner');

  try {
    // Wait for spinner to appear first (if it will appear)
    await spinner.waitFor({ state: 'visible', timeout: 1000 });
  } catch {
    // Spinner might not appear if data loads quickly
  }

  // Wait for spinner to disappear
  await spinner.waitFor({ state: 'hidden', timeout });
}

/**
 * Wait for snackbar message to appear and optionally check its content
 */
export async function waitForSnackbar(
  page: Page,
  expectedText?: string,
  timeout = 5000
): Promise<void> {
  const snackbar = page.locator('mat-snack-bar-container, .mat-mdc-snack-bar-container');
  await snackbar.waitFor({ state: 'visible', timeout });

  if (expectedText) {
    await page.waitForSelector(`text=${expectedText}`, { timeout });
  }
}

/**
 * Wait for snackbar to disappear
 */
export async function waitForSnackbarDismissed(page: Page, timeout = 10000): Promise<void> {
  const snackbar = page.locator('mat-snack-bar-container, .mat-mdc-snack-bar-container');
  await snackbar.waitFor({ state: 'hidden', timeout });
}

/**
 * Wait for dialog/modal to open
 */
export async function waitForDialog(page: Page, timeout = 5000): Promise<Locator> {
  const dialog = page.locator('mat-dialog-container, .mat-mdc-dialog-container');
  await dialog.waitFor({ state: 'visible', timeout });
  return dialog;
}

/**
 * Wait for dialog to close
 */
export async function waitForDialogClosed(page: Page, timeout = 5000): Promise<void> {
  const dialog = page.locator('mat-dialog-container, .mat-mdc-dialog-container');
  await dialog.waitFor({ state: 'hidden', timeout });
}

/**
 * Wait for table/list data to load
 */
export async function waitForDataLoad(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await waitForLoadingComplete(page);
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Wait for empty state to appear
 */
export async function waitForEmptyState(page: Page, timeout = 5000): Promise<void> {
  const emptyState = page.locator('.empty-state, [data-testid="empty-state"]');
  await emptyState.waitFor({ state: 'visible', timeout });
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(
  page: Page,
  url: string | RegExp,
  timeout = 5000
): Promise<void> {
  await page.waitForURL(url, { timeout });
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for element to be stable (no animations)
 */
export async function waitForElementStable(
  locator: Locator,
  timeout = 5000
): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout });

  // Wait for animations to complete
  await locator.evaluate((el) => {
    return Promise.all(
      el.getAnimations().map((animation) => animation.finished)
    );
  });
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Wait for multiple API responses
 */
export async function waitForMultipleApiResponses(
  page: Page,
  urlPatterns: (string | RegExp)[],
  timeout = 10000
): Promise<void> {
  await Promise.all(
    urlPatterns.map((pattern) => waitForApiResponse(page, pattern, timeout))
  );
}
