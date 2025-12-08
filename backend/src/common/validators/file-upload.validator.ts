import { BadRequestException } from '@nestjs/common';
import { SecurityConfig } from '@config/security.config';

/**
 * File Upload Validator
 * Validates file uploads for security threats
 */

export class FileUploadValidator {
  /**
   * Validate file extension
   * @param filename - Name of the file
   * @returns true if valid
   * @throws BadRequestException if invalid
   */
  static validateFileExtension(filename: string): boolean {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

    if (!SecurityConfig.fileUpload.allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `File extension ${extension} is not allowed. Allowed extensions: ${SecurityConfig.fileUpload.allowedExtensions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Validate MIME type
   * @param mimeType - MIME type of the file
   * @returns true if valid
   * @throws BadRequestException if invalid
   */
  static validateMimeType(mimeType: string): boolean {
    if (!SecurityConfig.fileUpload.allowedMimeTypes.includes(mimeType.toLowerCase())) {
      throw new BadRequestException(
        `MIME type ${mimeType} is not allowed. Allowed types: ${SecurityConfig.fileUpload.allowedMimeTypes.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Validate file size
   * @param size - Size of the file in bytes
   * @returns true if valid
   * @throws BadRequestException if invalid
   */
  static validateFileSize(size: number): boolean {
    if (size > SecurityConfig.fileUpload.maxFileSize) {
      const maxSizeMB = SecurityConfig.fileUpload.maxFileSize / (1024 * 1024);
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      );
    }

    return true;
  }

  /**
   * Validate number of files
   * @param count - Number of files
   * @returns true if valid
   * @throws BadRequestException if invalid
   */
  static validateFileCount(count: number): boolean {
    if (count > SecurityConfig.fileUpload.maxFilesPerUpload) {
      throw new BadRequestException(
        `Cannot upload more than ${SecurityConfig.fileUpload.maxFilesPerUpload} files at once`,
      );
    }

    return true;
  }

  /**
   * Validate photo URL from Supabase Storage
   * Ensures URL is from trusted storage bucket
   * @param url - Photo URL
   * @returns true if valid
   * @throws BadRequestException if invalid
   */
  static validatePhotoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      throw new BadRequestException('Invalid photo URL');
    }

    // Must be HTTPS
    if (!url.startsWith('https://')) {
      throw new BadRequestException('Photo URL must use HTTPS protocol');
    }

    // Must be from Supabase storage
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    if (!supabaseUrl || !url.startsWith(`${supabaseUrl}/storage/v1/object/public/`)) {
      throw new BadRequestException('Photo URL must be from Supabase Storage');
    }

    // Must be from allowed buckets
    const allowedBuckets = ['rating-photos', 'report-photos'];
    const bucketMatch = allowedBuckets.some((bucket) =>
      url.includes(`/storage/v1/object/public/${bucket}/`),
    );

    if (!bucketMatch) {
      throw new BadRequestException(
        `Photo URL must be from allowed buckets: ${allowedBuckets.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Validate array of photo URLs
   * @param urls - Array of photo URLs
   * @returns true if valid
   * @throws BadRequestException if invalid
   */
  static validatePhotoUrls(urls: string[]): boolean {
    if (!Array.isArray(urls)) {
      throw new BadRequestException('Photo URLs must be an array');
    }

    this.validateFileCount(urls.length);

    urls.forEach((url) => this.validatePhotoUrl(url));

    return true;
  }

  /**
   * Sanitize filename to prevent path traversal
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    // Remove path separators and special characters
    return filename
      .replace(/[/\\]/g, '')
      .replace(/[^\w\s.-]/g, '')
      .replace(/\.{2,}/g, '.')
      .trim();
  }
}
