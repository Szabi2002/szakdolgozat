import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StopsService } from '../../../core/services/stops.service';
import { MapComponent } from '../../../shared/components/map/map.component';

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
}

export interface StopRoute {
  id: string;
  route_number: string;
  name: string;
  direction?: string;
}

@Component({
  selector: 'app-stop-details',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MapComponent,
  ],
  templateUrl: './stop-details.component.html',
  styleUrl: './stop-details.component.scss',
})
export class StopDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MapComponent) mapComponent?: MapComponent;

  stop: Stop | null = null;
  routes: StopRoute[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stopsService: StopsService
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['id']) {
          this.loadStopDetails(params['id']);
        }
      });
  }

  ngAfterViewInit() {
    // Ensure map renders correctly after view initialization
    // Additional safeguard for tile alignment issues
    setTimeout(() => {
      if (this.mapComponent && this.mapComponent.map) {
        this.mapComponent.map.invalidateSize();
      }
    }, 300);
  }

  private loadStopDetails(stopId: string) {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.stopsService.getStop(stopId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stop: any) => {
        this.stop = {
          id: stop.id,
          name: stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          description: stop.description,
        };

        // Extract routes from the stop response - backend returns routes as part of stop details
        if (stop.routes && Array.isArray(stop.routes)) {
          this.routes = stop.routes.map((r: any) => ({
            id: r.id,
            route_number: r.route_number,
            name: r.name,
            direction: r.direction,
          }));
        } else {
          // No routes found, initialize as empty array
          this.routes = [];
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load stop details', err);
        this.hasError = true;
        this.errorMessage = err.status === 404
          ? 'A megálló nem található'
          : 'Hiba történt a megálló adatainak betöltése során';
        this.isLoading = false;
      },
    });
  }

  goToRoute(route: StopRoute) {
    this.router.navigate(['/routes', route.id]);
  }

  goBack() {
    this.router.navigate(['/stops']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
