/**
 * User Model
 * Represents a user in the application
 */
export interface User {
  id: string;
  email: string;
  name: string;
  profile_picture_url?: string;
  role: UserRole;
  phone_number?: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * User role enum
 */
export type UserRole = 'user' | 'admin' | 'provider';

/**
 * Auth response from backend after Google OAuth
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Session information
 */
export interface Session {
  user: User;
  token: string;
  expiresAt?: Date;
}
