import { BadRequestException } from '@nestjs/common';

/**
 * Input Sanitizer
 * Sanitizes and validates user input to prevent XSS, SQL injection, and other attacks
 */

export class InputSanitizer {
  /**
   * Sanitize HTML input by removing potentially dangerous tags and attributes
   * @param input - Raw HTML input
   * @returns Sanitized string
   */
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove script tags and their content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: protocol (can be used for XSS)
    sanitized = sanitized.replace(/data:text\/html/gi, '');

    // Remove potentially dangerous tags
    const dangerousTags = [
      'script',
      'iframe',
      'object',
      'embed',
      'applet',
      'meta',
      'link',
      'style',
      'form',
      'input',
      'button',
      'textarea',
      'select',
    ];

    dangerousTags.forEach((tag) => {
      const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
      sanitized = sanitized.replace(regex, '');
      // Also remove self-closing tags
      const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
      sanitized = sanitized.replace(selfClosingRegex, '');
    });

    return sanitized.trim();
  }

  /**
   * Sanitize plain text input
   * @param input - Raw text input
   * @param maxLength - Maximum allowed length
   * @returns Sanitized string
   */
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove any HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Enforce max length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validate and sanitize UUID
   * @param uuid - UUID string
   * @returns Sanitized UUID
   * @throws BadRequestException if invalid
   */
  static sanitizeUuid(uuid: string): string {
    if (!uuid || typeof uuid !== 'string') {
      throw new BadRequestException('Invalid UUID format');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      throw new BadRequestException('Invalid UUID format');
    }

    return uuid.toLowerCase();
  }

  /**
   * Validate and sanitize email address
   * @param email - Email string
   * @returns Sanitized email
   * @throws BadRequestException if invalid
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Invalid email format');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const sanitized = email.toLowerCase().trim();

    if (!emailRegex.test(sanitized)) {
      throw new BadRequestException('Invalid email format');
    }

    if (sanitized.length > 254) {
      throw new BadRequestException('Email address too long');
    }

    return sanitized;
  }

  /**
   * Validate and sanitize URL
   * @param url - URL string
   * @param allowedProtocols - Allowed URL protocols
   * @returns Sanitized URL
   * @throws BadRequestException if invalid
   */
  static sanitizeUrl(url: string, allowedProtocols: string[] = ['https', 'http']): string {
    if (!url || typeof url !== 'string') {
      throw new BadRequestException('Invalid URL format');
    }

    try {
      const parsedUrl = new URL(url);

      if (!allowedProtocols.includes(parsedUrl.protocol.replace(':', ''))) {
        throw new BadRequestException(
          `URL protocol must be one of: ${allowedProtocols.join(', ')}`,
        );
      }

      return parsedUrl.toString();
    } catch (error) {
      throw new BadRequestException('Invalid URL format');
    }
  }

  /**
   * Sanitize SQL LIKE pattern to prevent SQL injection
   * @param pattern - Search pattern
   * @returns Sanitized pattern
   */
  static sanitizeSqlLikePattern(pattern: string): string {
    if (!pattern || typeof pattern !== 'string') {
      return '';
    }

    // Escape special SQL LIKE characters
    return pattern
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      .replace(/'/g, "''");
  }

  /**
   * Validate array of strings
   * @param array - Array to validate
   * @param maxLength - Maximum array length
   * @param maxItemLength - Maximum item length
   * @returns Validated array
   * @throws BadRequestException if invalid
   */
  static sanitizeStringArray(
    array: any[],
    maxLength: number = 100,
    maxItemLength: number = 1000,
  ): string[] {
    if (!Array.isArray(array)) {
      throw new BadRequestException('Input must be an array');
    }

    if (array.length > maxLength) {
      throw new BadRequestException(`Array cannot contain more than ${maxLength} items`);
    }

    return array.map((item) => {
      if (typeof item !== 'string') {
        throw new BadRequestException('All array items must be strings');
      }
      return this.sanitizeText(item, maxItemLength);
    });
  }

  /**
   * Validate and sanitize numeric input
   * @param value - Numeric value
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns Validated number
   * @throws BadRequestException if invalid
   */
  static sanitizeNumber(value: any, min?: number, max?: number): number {
    const num = Number(value);

    if (isNaN(num) || !isFinite(num)) {
      throw new BadRequestException('Invalid number format');
    }

    if (min !== undefined && num < min) {
      throw new BadRequestException(`Number must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
      throw new BadRequestException(`Number must not exceed ${max}`);
    }

    return num;
  }

  /**
   * Validate and sanitize integer input
   * @param value - Integer value
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns Validated integer
   * @throws BadRequestException if invalid
   */
  static sanitizeInteger(value: any, min?: number, max?: number): number {
    const num = this.sanitizeNumber(value, min, max);

    if (!Number.isInteger(num)) {
      throw new BadRequestException('Value must be an integer');
    }

    return num;
  }

  /**
   * Sanitize object keys to prevent prototype pollution
   * @param obj - Object to sanitize
   * @returns Sanitized object
   */
  static sanitizeObjectKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObjectKeys(item));
    }

    const sanitized: any = {};

    Object.keys(obj).forEach((key) => {
      if (!dangerousKeys.includes(key)) {
        sanitized[key] = this.sanitizeObjectKeys(obj[key]);
      }
    });

    return sanitized;
  }
}
