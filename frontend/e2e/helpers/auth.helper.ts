import { Page, BrowserContext } from '@playwright/test';

/**
 * E2E Test Helpers - Authentication
 * Sprint 9-10: Helper functions for managing authenticated test state
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  display_name?: string;
  role: string;
  created_at?: string;
}

/**
 * Setup authenticated state with mock user data
 */
export async function setupAuthenticatedState(
  context: BrowserContext,
  user?: Partial<MockUser>
): Promise<void> {
  const defaultUser: MockUser = {
    id: user?.id || 'test-user-123e4567-e89b-12d3-a456-426614174000',
    email: user?.email || 'test@example.com',
    name: user?.name || 'Test User',
    display_name: user?.display_name || 'Test User',
    role: user?.role || 'user',
    created_at: user?.created_at || '2025-01-01T00:00:00Z'
  };

  await context.addInitScript((userData) => {
    localStorage.setItem('access_token', 'mock-jwt-token-for-testing-' + Date.now());
    localStorage.setItem('user', JSON.stringify(userData));
  }, defaultUser);
}

/**
 * Setup multiple mock users for testing RLS/isolation
 */
export async function setupMultipleUsers(
  contexts: BrowserContext[]
): Promise<MockUser[]> {
  const users: MockUser[] = [
    {
      id: 'user-a-123e4567-e89b-12d3-a456-426614174000',
      email: 'user-a@example.com',
      name: 'User A',
      display_name: 'User A',
      role: 'user'
    },
    {
      id: 'user-b-223e4567-e89b-12d3-a456-426614174001',
      email: 'user-b@example.com',
      name: 'User B',
      display_name: 'User B',
      role: 'user'
    }
  ];

  for (let i = 0; i < contexts.length && i < users.length; i++) {
    await setupAuthenticatedState(contexts[i], users[i]);
  }

  return users;
}

/**
 * Clear authentication state
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    sessionStorage.clear();
  });
}

/**
 * Check if user is authenticated (has valid token)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const token = localStorage.getItem('access_token');
    return !!token;
  });
}

/**
 * Get current user from localStorage
 */
export async function getCurrentUser(page: Page): Promise<MockUser | null> {
  return await page.evaluate(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
}

/**
 * Wait for authentication redirect
 */
export async function waitForAuthRedirect(page: Page, timeout = 5000): Promise<void> {
  await page.waitForURL(/.*login/, { timeout });
}

/**
 * Wait for authenticated page load
 */
export async function waitForAuthenticatedPage(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}
