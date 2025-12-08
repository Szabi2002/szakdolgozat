import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Loading Service
 * Manages global loading state
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  /**
   * Show loading spinner
   * Increments request counter
   */
  show(): void {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Hide loading spinner
   * Decrements request counter
   */
  hide(): void {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.loadingSubject.next(false);
    }
  }

  /**
   * Check if loading is active
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Force hide loading (use with caution)
   */
  forceHide(): void {
    this.requestCount = 0;
    this.loadingSubject.next(false);
  }
}
