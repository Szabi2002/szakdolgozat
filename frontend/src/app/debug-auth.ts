/**
 * Authentication Debug Utilities
 *
 * Usage in browser console:
 *
 * 1. Check token status:
 *    debugAuth.checkToken()
 *
 * 2. Check user status:
 *    debugAuth.checkUser()
 *
 * 3. Verify admin access:
 *    debugAuth.verifyAdmin()
 *
 * 4. Full diagnostic:
 *    debugAuth.fullDiagnostic()
 */

export const debugAuth = {
  /**
   * Check if auth token exists and is valid
   */
  checkToken() {
    console.group('🔑 Token Status');

    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.error('❌ No token found in localStorage');
      console.log('Token key checked: auth_token');
      console.groupEnd();
      return false;
    }

    console.log('✅ Token exists');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 30) + '...');

    try {
      // Decode JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ Invalid JWT format');
        console.groupEnd();
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      const expiresAt = new Date(payload.exp * 1000);
      const now = Date.now();
      const minutesUntilExpiry = (payload.exp * 1000 - now) / 1000 / 60;
      const isExpired = minutesUntilExpiry < 0;

      console.log('Token payload:', payload);
      console.log('Issued at:', new Date(payload.iat * 1000).toLocaleString());
      console.log('Expires at:', expiresAt.toLocaleString());
      console.log('Minutes until expiry:', minutesUntilExpiry.toFixed(2));

      if (isExpired) {
        console.error('❌ Token is EXPIRED');
        console.log('Expired by:', Math.abs(minutesUntilExpiry).toFixed(2), 'minutes');
      } else {
        console.log('✅ Token is VALID');
      }

      console.groupEnd();
      return !isExpired;
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      console.groupEnd();
      return false;
    }
  },

  /**
   * Check current user status
   */
  checkUser() {
    console.group('👤 User Status');

    const userJson = localStorage.getItem('current_user');

    if (!userJson) {
      console.error('❌ No user found in localStorage');
      console.log('User key checked: current_user');
      console.groupEnd();
      return null;
    }

    try {
      const user = JSON.parse(userJson);
      console.log('✅ User found');
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Created:', user.created_at);

      console.groupEnd();
      return user;
    } catch (error) {
      console.error('❌ Failed to parse user data:', error);
      console.groupEnd();
      return null;
    }
  },

  /**
   * Verify admin access
   */
  verifyAdmin() {
    console.group('🔐 Admin Access Verification');

    const user = this.checkUser();

    if (!user) {
      console.error('❌ Cannot verify admin - no user found');
      console.groupEnd();
      return false;
    }

    const isAdmin = user.role === 'admin';

    if (isAdmin) {
      console.log('✅ User HAS admin access');
      console.log('Role:', user.role);
    } else {
      console.error('❌ User DOES NOT have admin access');
      console.log('Current role:', user.role);
      console.log('Required role: admin');
    }

    console.groupEnd();
    return isAdmin;
  },

  /**
   * Check Supabase session
   */
  checkSupabaseSession() {
    console.group('🔵 Supabase Session');

    try {
      // Try to find Supabase storage key
      const keys = Object.keys(localStorage).filter(key => key.startsWith('sb-'));

      if (keys.length === 0) {
        console.warn('⚠️ No Supabase session found');
        console.log('This is OK if using email/password login');
        console.groupEnd();
        return null;
      }

      const supabaseKey = keys[0];
      console.log('Supabase key:', supabaseKey);

      const sessionJson = localStorage.getItem(supabaseKey);
      if (!sessionJson) {
        console.error('❌ Supabase key found but no session data');
        console.groupEnd();
        return null;
      }

      const session = JSON.parse(sessionJson);
      console.log('✅ Supabase session found');

      if (session.access_token) {
        const parts = session.access_token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        const expiresAt = new Date(payload.exp * 1000);
        const minutesUntilExpiry = (payload.exp * 1000 - Date.now()) / 1000 / 60;

        console.log('Supabase token expires:', expiresAt.toLocaleString());
        console.log('Minutes until expiry:', minutesUntilExpiry.toFixed(2));
      }

      console.groupEnd();
      return session;
    } catch (error) {
      console.error('❌ Error checking Supabase session:', error);
      console.groupEnd();
      return null;
    }
  },

  /**
   * Test admin API call
   */
  async testAdminAPI() {
    console.group('🧪 Testing Admin API');

    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.error('❌ No token found - cannot test API');
      console.groupEnd();
      return;
    }

    try {
      const apiUrl = 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Admin API call successful');
        console.log('Stats data:', data);
      } else {
        const error = await response.text();
        console.error('❌ Admin API call failed');
        console.log('Error response:', error);

        if (response.status === 401) {
          console.log('Possible causes:');
          console.log('1. Token expired');
          console.log('2. Invalid token');
          console.log('3. User not authenticated');
        } else if (response.status === 403) {
          console.log('Possible causes:');
          console.log('1. User role is not "admin"');
          console.log('2. Admin guard blocked access');
        }
      }

      console.groupEnd();
    } catch (error) {
      console.error('❌ Network error:', error);
      console.log('Make sure backend is running on http://localhost:3000');
      console.groupEnd();
    }
  },

  /**
   * Run full diagnostic
   */
  async fullDiagnostic() {
    console.clear();
    console.log('🔍 Running Full Authentication Diagnostic...\n');

    const tokenValid = this.checkToken();
    const user = this.checkUser();
    const isAdmin = this.verifyAdmin();
    const supabaseSession = this.checkSupabaseSession();

    console.group('📊 Summary');
    console.log('Token valid:', tokenValid ? '✅' : '❌');
    console.log('User found:', user ? '✅' : '❌');
    console.log('Is admin:', isAdmin ? '✅' : '❌');
    console.log('Supabase session:', supabaseSession ? '✅' : '⚠️ (optional)');
    console.groupEnd();

    if (tokenValid && user && isAdmin) {
      console.log('\n✅ All checks passed! Testing admin API...\n');
      await this.testAdminAPI();
    } else {
      console.log('\n❌ Some checks failed. Fix these issues first:\n');

      if (!tokenValid) {
        console.log('1. Token is missing or expired');
        console.log('   → Login again to get a new token');
      }

      if (!user) {
        console.log('2. User data is missing');
        console.log('   → Login again to restore user data');
      }

      if (!isAdmin) {
        console.log('3. User is not an admin');
        console.log('   → Update user role in database:');
        console.log('   UPDATE public.users SET role = \'admin\' WHERE email = \'your@email.com\'');
      }
    }

    console.log('\n📝 To run individual checks:');
    console.log('debugAuth.checkToken()');
    console.log('debugAuth.checkUser()');
    console.log('debugAuth.verifyAdmin()');
    console.log('debugAuth.testAdminAPI()');
  },

  /**
   * Clear all auth data
   */
  clearAuth() {
    console.group('🗑️ Clearing Authentication Data');

    const keysToRemove = [
      'auth_token',
      'current_user',
      ...Object.keys(localStorage).filter(key => key.startsWith('sb-'))
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('Removed:', key);
    });

    console.log('✅ All authentication data cleared');
    console.log('Reload the page and login again');
    console.groupEnd();
  },

  /**
   * Show helpful commands
   */
  help() {
    console.log(`
🔍 Authentication Debug Commands
================================

Basic Checks:
  debugAuth.checkToken()        - Check if token exists and is valid
  debugAuth.checkUser()          - Check current user data
  debugAuth.verifyAdmin()        - Verify admin access
  debugAuth.checkSupabaseSession() - Check Supabase session

Testing:
  debugAuth.testAdminAPI()       - Test admin API endpoint
  debugAuth.fullDiagnostic()     - Run all checks and test API

Utilities:
  debugAuth.clearAuth()          - Clear all auth data
  debugAuth.help()               - Show this help message

Example Workflow:
  1. debugAuth.fullDiagnostic()  - Run full diagnostic
  2. Fix any issues found
  3. debugAuth.testAdminAPI()    - Test admin endpoint
    `);
  }
};

// Auto-expose to window in development
if (typeof window !== 'undefined' && !('production' in window)) {
  (window as any).debugAuth = debugAuth;
  console.log('🔍 Debug utilities loaded. Type "debugAuth.help()" for commands.');
}
