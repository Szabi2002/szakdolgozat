import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '@shared/material/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, debounceTime, map, startWith, switchMap, of } from 'rxjs';
import { StopsService } from '@core/services/stops.service';
import { Stop } from '@core/services/routes.service';

@Component({
  selector: 'app-quick-trip-planner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './quick-trip-planner.component.html',
  styleUrls: ['./quick-trip-planner.component.scss'],
})
export class QuickTripPlannerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private stopsService = inject(StopsService);
  private snackBar = inject(MatSnackBar);

  tripForm: FormGroup;
  filteredFromStops$!: Observable<Stop[]>;
  filteredToStops$!: Observable<Stop[]>;

  constructor() {
    this.tripForm = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      date: [new Date(), Validators.required],
      time: [this.getCurrentTime(), Validators.required],
    });
  }

  ngOnInit(): void {
    this.setupAutocomplete();
  }

  private getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Setup autocomplete for from and to stops
   */
  private setupAutocomplete(): void {
    this.filteredFromStops$ = this.tripForm.get('from')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.stopsService.getStops({
            search: value,
            limit: 20
          }).pipe(
            map(stops => this.deduplicateStops(stops))
          );
        }
        return of([]);
      })
    );

    this.filteredToStops$ = this.tripForm.get('to')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.stopsService.getStops({
            search: value,
            limit: 20
          }).pipe(
            map(stops => this.deduplicateStops(stops))
          );
        }
        return of([]);
      })
    );
  }

  /**
   * Deduplicates stops by name, keeping the most relevant stop
   */
  private deduplicateStops(stops: Stop[]): Stop[] {
    const deduplicatedMap = new Map<string, Stop>();
    stops.forEach(stop => {
      const existing = deduplicatedMap.get(stop.name);
      if (!existing || (stop.type === existing.type && stop.id < existing.id)) {
        deduplicatedMap.set(stop.name, stop);
      }
    });
    return Array.from(deduplicatedMap.values());
  }

  /**
   * Display function for autocomplete
   */
  displayStopFn(stop: Stop | string): string {
    return typeof stop === 'string' ? stop : stop?.name || '';
  }

  /**
   * Get icon for stop type
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
        return 'place';
    }
  }

  /**
   * Search for routes - FIXED to pass stop IDs instead of names
   */
  searchRoutes(): void {
    if (this.tripForm.valid) {
      const fromStop = this.tripForm.get('from')?.value;
      const toStop = this.tripForm.get('to')?.value;

      // Validate that Stop objects are selected, not strings
      if (typeof fromStop === 'string' || typeof toStop === 'string') {
        this.snackBar.open('Kérem válasszon érvényes megállót a listából!', 'OK', { duration: 3000 });
        return;
      }

      const formValue = this.tripForm.value;

      // Navigate to trip planner with stop IDs (FIXED: was passing names before)
      this.router.navigate(['/planner'], {
        queryParams: {
          from: fromStop.id,  // FIXED: Pass stop ID instead of name
          to: toStop.id,      // FIXED: Pass stop ID instead of name
          date: formValue.date,
          time: formValue.time,
        },
      });
    } else {
      this.snackBar.open('Kérem töltse ki a kötelező mezőket!', 'OK', { duration: 3000 });
    }
  }

  /**
   * Swap from and to fields
   */
  swapLocations(): void {
    const from = this.tripForm.get('from')?.value;
    const to = this.tripForm.get('to')?.value;

    this.tripForm.patchValue({
      from: to,
      to: from,
    });
  }
}
