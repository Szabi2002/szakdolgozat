import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MaterialModule } from '@shared/material/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, debounceTime, map, startWith, switchMap, of, forkJoin } from 'rxjs';
import { StopsService } from '@core/services/stops.service';
import { PlannerService, PlanTripDto, TripSearchResponse, Route } from '@core/services/planner.service';
import { Stop } from '@core/services/routes.service';
import { MapComponent } from '@shared/components/map/map.component';
import { RouteCardComponent } from '../../components/route-card/route-card.component';

@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, MapComponent, RouteCardComponent],
  templateUrl: './trip-planner.component.html',
  styleUrl: './trip-planner.component.scss'
})
export class TripPlannerComponent implements OnInit {
  @ViewChild(MapComponent) mapComponent?: MapComponent;

  private fb = inject(FormBuilder);
  private stopsService = inject(StopsService);
  private plannerService = inject(PlannerService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  plannerForm!: FormGroup;
  filteredFromStops$!: Observable<Stop[]>;
  filteredToStops$!: Observable<Stop[]>;

  // Updated signals
  selectedRoute = signal<Route | null>(null);
  alternatives = signal<Route[]>([]);
  isLoading = signal(false);
  fromStop = signal<Stop | null>(null);
  toStop = signal<Stop | null>(null);
  searchPerformed = signal(false);
  fromStopsCount = signal(0);
  toStopsCount = signal(0);
  fromInputLength = signal(0);
  toInputLength = signal(0);

  ngOnInit(): void {
    this.initForm();
    this.setupAutocomplete();
    this.handleQueryParams();
  }

  private initForm(): void {
    this.plannerForm = this.fb.group({
      fromStop: ['', Validators.required],
      toStop: ['', Validators.required],
      date: [new Date()],
      time: [this.getCurrentTime()]
    });
  }

  private getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private setupAutocomplete(): void {
    // Use server-side search instead of client-side filtering
    // This allows searching all 349+ stops instead of just the first 10-100
    this.filteredFromStops$ = this.plannerForm.get('fromStop')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const inputValue = typeof value === 'string' ? value : '';
        this.fromInputLength.set(inputValue.length);

        if (typeof value === 'string' && value.length >= 2) {
          // Server-side search using backend's ILIKE query
          // Backend already handles Hungarian characters correctly via PostgreSQL collation
          return this.stopsService.getStops({
            search: value,
            limit: 20  // Show top 20 results
          }).pipe(
            map(stops => {
              // Frontend fallback deduplication (backend should already deduplicate)
              const deduplicated = this.deduplicateStops(stops);
              this.fromStopsCount.set(deduplicated.length);
              return deduplicated;
            })
          );
        }
        this.fromStopsCount.set(0);
        return of([]);
      })
    );

    this.filteredToStops$ = this.plannerForm.get('toStop')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const inputValue = typeof value === 'string' ? value : '';
        this.toInputLength.set(inputValue.length);

        if (typeof value === 'string' && value.length >= 2) {
          // Server-side search using backend's ILIKE query
          return this.stopsService.getStops({
            search: value,
            limit: 20  // Show top 20 results
          }).pipe(
            map(stops => {
              // Frontend fallback deduplication (backend should already deduplicate)
              const deduplicated = this.deduplicateStops(stops);
              this.toStopsCount.set(deduplicated.length);
              return deduplicated;
            })
          );
        }
        this.toStopsCount.set(0);
        return of([]);
      })
    );
  }

  /**
   * Deduplicates stops by name, keeping the most relevant stop
   * Priority: 1) metro/tram/bus over general, 2) alphabetically first ID
   */
  private deduplicateStops(stops: Stop[]): Stop[] {
    const deduplicatedMap = new Map<string, Stop>();

    stops.forEach(stop => {
      const existing = deduplicatedMap.get(stop.name);

      if (!existing) {
        deduplicatedMap.set(stop.name, stop);
      } else {
        // If same type, keep the one with smaller ID for consistency
        const shouldReplace =

          (stop.type === existing.type && stop.id < existing.id);

        if (shouldReplace) {
          deduplicatedMap.set(stop.name, stop);
        }
      }
    });

    return Array.from(deduplicatedMap.values());
  }

  displayStopFn(stop: Stop | string): string {
    return typeof stop === 'string' ? stop : stop?.name || '';
  }

  /**
   * Get the appropriate icon for a stop type
   */
  getStopIcon(type: string): string {
    switch (type) {
      case 'metro':
        return 'subway';
      case 'tram':
        return 'tram';
      case 'bus':
        return 'directions_bus';
      default:
        return 'place'; // For 'general' and any other types
    }
  }

  swapStops(): void {
    const fromStop = this.plannerForm.get('fromStop')?.value;
    const toStop = this.plannerForm.get('toStop')?.value;

    this.plannerForm.patchValue({
      fromStop: toStop,
      toStop: fromStop
    });
  }

  onSearch(): void {
    if (this.plannerForm.invalid) {
      this.snackBar.open('Kérem töltse ki a kötelező mezőket!', 'OK', { duration: 3000 });
      return;
    }

    const fromStop = this.plannerForm.value.fromStop;
    const toStop = this.plannerForm.value.toStop;

    if (typeof fromStop === 'string' || typeof toStop === 'string') {
      this.snackBar.open('Kérem válasszon érvényes megállót a listából!', 'OK', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);
    // Store the selected stops for ticket purchase
    this.fromStop.set(fromStop);
    this.toStop.set(toStop);

    this.searchPerformed.set(false);

    const searchDto: PlanTripDto = {
      from_stop_id: fromStop.id,
      to_stop_id: toStop.id,
      date: this.formatDate(this.plannerForm.value.date),
      time: this.plannerForm.value.time,
      include_walking: true,
      max_alternatives: 3,
      preference: 'fastest'
    };

    this.plannerService.searchRoute(searchDto).subscribe({
      next: (response: TripSearchResponse) => {
        this.alternatives.set(response.alternatives);

        if (response.alternatives.length > 0) {
          this.selectedRoute.set(response.alternatives[0]); // Select first by default
          this.displayRouteOnMap(response.alternatives[0]);
        }

        this.searchPerformed.set(true);
        this.isLoading.set(false);

        if (response.alternatives.length === 0) {
          this.snackBar.open('Nem található útvonal a megadott megállók között.', 'OK', { duration: 5000 });
        }
      },
      error: (error) => {
        // Route search error handled via snackbar
        this.isLoading.set(false);
        this.searchPerformed.set(true);
        this.snackBar.open(error.message || 'Hiba történt az útvonalkeresés során.', 'OK', { duration: 5000 });
      }
    });
  }

  displayRouteOnMap(route: Route): void {
    if (this.mapComponent && this.mapComponent.map) {
      this.mapComponent.drawRoute(route);
    } else {
      // Wait for map component to be fully initialized
      // Waiting for map initialization
      this.waitForMapInitialization(route);
    }
  }

  private waitForMapInitialization(route: Route, maxAttempts = 10, attempt = 0): void {
    if (attempt >= maxAttempts) {
      // Map initialization failed
      this.snackBar.open('Térkép inicializálási hiba', 'OK', { duration: 3000 });
      return;
    }

    const checkInterval = 300;
    setTimeout(() => {
      if (this.mapComponent && this.mapComponent.map) {
        // Map component initialized
        this.mapComponent.drawRoute(route);
      } else {
        // Map not ready, retrying
        this.waitForMapInitialization(route, maxAttempts, attempt + 1);
      }
    }, checkInterval);
  }


  selectAlternative(route: Route): void {
    this.selectedRoute.set(route);
    this.displayRouteOnMap(route);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Handle query parameters from favorite route selection
   * Loads the stops and pre-fills the form
   */
  private handleQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      const fromStopId = params['from'];
      const toStopId = params['to'];

      if (fromStopId && toStopId) {
        // Load stops data to populate the form
        this.loadStopsAndPrefillForm(fromStopId, toStopId);
      }
    });
  }

  /**
   * Load stop objects by ID and pre-fill the form
   */
  private loadStopsAndPrefillForm(fromStopId: string, toStopId: string): void {
    this.isLoading.set(true);

    // Get all stops and find the ones we need
    // Use forkJoin to fetch both stops concurrently by their exact ID
    forkJoin({
      from: this.stopsService.getStop(fromStopId),
      to: this.stopsService.getStop(toStopId)
    }).subscribe({
      next: (results) => {
        const fromStop = results.from;
        const toStop = results.to;

        if (fromStop && toStop) {
          // Pre-fill the form with the selected stops
          this.plannerForm.patchValue({
            fromStop: fromStop,
            toStop: toStop
          });

          // Store stops for later use
          this.fromStop.set(fromStop);
          this.toStop.set(toStop);

          // Show success message
          this.snackBar.open(
            `Útvonal betöltve: ${fromStop.name} → ${toStop.name}`,
            'Keresés',
            { duration: 5000 }
          ).onAction().subscribe(() => {
            this.onSearch();
          });

          // Auto-trigger search if we have valid data
          this.onSearch();
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error loading stops:', error);
        this.snackBar.open(
          'Hiba: Nem található a megadott megálló(k) vagy hálózati hiba történt',
          'OK',
          { duration: 3000 }
        );
      }
    });
  }
}
