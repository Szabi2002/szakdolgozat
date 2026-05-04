import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '@environments/environment';

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 perc – Render free tier 15 perc után alszik

@Injectable({
  providedIn: 'root',
})
export class KeepAliveService implements OnDestroy {
  private subscription: Subscription | null = null;

  constructor(private http: HttpClient) {}

  start(): void {
    if (!environment.production || this.subscription) return;

    // Azonnali ping az alkalmazás indításakor, hogy a backend felébredjen
    this.ping().subscribe();

    // Rendszeres ping 10 percenként
    this.subscription = interval(PING_INTERVAL_MS)
      .pipe(switchMap(() => this.ping()))
      .subscribe();
  }

  private ping() {
    return this.http
      .get(`${environment.apiUrl}/health`)
      .pipe(catchError(() => of(null)));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
