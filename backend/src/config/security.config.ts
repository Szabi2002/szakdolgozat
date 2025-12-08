/**
 * Security Configuration
 * Centralized security settings for the application
 */

export const SecurityConfig = {
  /**
   * Password Requirements
   */
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },

  /**
   * JWT Token Configuration
   */
  jwt: {
    expiresIn: '24h',
    refreshExpiresIn: '7d',
  },

  /**
   * File Upload Restrictions
   */
  fileUpload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
    maxFilesPerUpload: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },

  /**
   * Rate Limiting Configuration
   */
  rateLimit: {
    global: {
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    },
    auth: {
      ttl: 900000, // 15 minutes
      limit: 5, // 5 login attempts per 15 minutes
    },
    api: {
      ttl: 60000, // 1 minute
      limit: 60, // 60 requests per minute for authenticated users
    },
    fileUpload: {
      ttl: 3600000, // 1 hour
      limit: 10, // 10 file uploads per hour
    },
  },

  /**
   * CORS Configuration
   */
  cors: {
    development: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    production: [], // Add production URLs here
  },

  /**
   * Content Security Policy
   */
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Angular requires unsafe-inline for now
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://*.supabase.co', 'https://api.mapbox.com'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },

  /**
   * Session Configuration
   */
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
  },

  /**
   * Input Validation
   */
  validation: {
    maxStringLength: 1000,
    maxArrayLength: 100,
    maxDescriptionLength: 2000,
    maxCommentLength: 500,
  },

  /**
   * Database Query Limits
   */
  database: {
    maxQueryResults: 1000,
    defaultPageSize: 20,
    maxPageSize: 100,
  },
};
