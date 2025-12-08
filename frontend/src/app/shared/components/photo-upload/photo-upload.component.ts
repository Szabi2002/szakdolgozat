import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface PhotoFile {
  file: File;
  preview: string;
  uploading?: boolean;
  error?: string;
}

/**
 * Photo upload component with drag & drop support
 */
@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './photo-upload.component.html',
  styleUrls: ['./photo-upload.component.scss']
})
export class PhotoUploadComponent {
  @Input() maxPhotos: number = 5;
  @Input() maxSizeBytes: number = 5 * 1024 * 1024; // 5MB
  @Input() acceptedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'];
  @Output() photosChange = new EventEmitter<File[]>();
  @Output() photosError = new EventEmitter<string>();

  photos: PhotoFile[] = [];
  isDragging = false;
  uploadProgress = 0;

  constructor() {
    console.log('[PhotoUploadComponent] Constructor called');
  }

  /**
   * Handle file selection from input
   * @param event File input change event
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  /**
   * Handle drag over event
   * @param event Drag event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Handle drag leave event
   * @param event Drag event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Handle file drop event
   * @param event Drop event
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  /**
   * Process selected files
   * @param files Array of files
   */
  private handleFiles(files: File[]): void {
    const remainingSlots = this.maxPhotos - this.photos.length;

    if (files.length > remainingSlots) {
      this.photosError.emit(`Összesen csak ${this.maxPhotos} fotót tölthetsz fel`);
      files = files.slice(0, remainingSlots);
    }

    files.forEach(file => {
      const error = this.validateFile(file);
      if (error) {
        this.photosError.emit(error);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.photos.push({
          file,
          preview: e.target?.result as string
        });
        this.emitPhotos();
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate a single file
   * @param file File to validate
   * @returns Error message or null
   */
  private validateFile(file: File): string | null {
    if (!this.acceptedTypes.includes(file.type)) {
      return `Érvénytelen fájltípus: ${file.name}. Csak JPEG, PNG és WebP képek engedélyezettek.`;
    }

    if (file.size > this.maxSizeBytes) {
      const maxSizeMB = this.maxSizeBytes / (1024 * 1024);
      return `Túl nagy fájl: ${file.name}. Maximum méret: ${maxSizeMB}MB.`;
    }

    return null;
  }

  /**
   * Remove a photo from the list
   * @param index Photo index
   */
  removePhoto(index: number): void {
    this.photos.splice(index, 1);
    this.emitPhotos();
  }

  /**
   * Emit current photos array
   */
  private emitPhotos(): void {
    this.photosChange.emit(this.photos.map(p => p.file));
  }

  /**
   * Clear all photos
   */
  clearAll(): void {
    this.photos = [];
    this.emitPhotos();
  }

  /**
   * Get formatted file size
   * @param bytes File size in bytes
   * @returns Formatted string
   */
  getFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  /**
   * Check if more photos can be added
   */
  canAddMore(): boolean {
    return this.photos.length < this.maxPhotos;
  }

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    const input = document.getElementById('photo-file-input') as HTMLInputElement;
    input?.click();
  }
}
