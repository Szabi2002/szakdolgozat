import { Component, EventEmitter, Input, OnInit, Output, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, Subject, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { ReportTypeSelectorComponent } from '@shared/components/report-type-selector/report-type-selector.component';
import { PhotoUploadComponent } from '@shared/components/photo-upload/photo-upload.component';
import { CreateReportDto, ReportType } from '@core/models/report.model';
import { ReportsService } from '@core/services/reports.service';
import { RoutesService, Route } from '@core/services/routes.service';
import { StopsService } from '@core/services/stops.service';
import { Stop } from '@core/services/routes.service';
import { SupabaseService } from '@core/services/supabase.service';

/**
 * Report form component with multi-step wizard
 * Handles report creation with photos
 */
@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ReportTypeSelectorComponent,
    PhotoUploadComponent
  ],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.scss']
})
export class ReportFormComponent implements OnInit, OnDestroy {
  @Input() prefilledRouteId?: string;
  @Input() prefilledStopId?: string;
  @Output() submitted = new EventEmitter<{ reportId: string; referenceNumber: string }>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private reportsService = inject(ReportsService);
  private routesService = inject(RoutesService);
  private stopsService = inject(StopsService);
  private supabaseService = inject(SupabaseService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  typeForm!: FormGroup;
  detailsForm!: FormGroup;
  isSubmitting = false;
  selectedPhotos: File[] = [];
  routes$!: Observable<Route[]>;
  stops$!: Observable<Stop[]>;

  ngOnInit(): void {
    console.log('[ReportFormComponent] ngOnInit called');
    try {
      this.initializeForms();
      console.log('[ReportFormComponent] Forms initialized successfully');
      console.log('[ReportFormComponent] typeForm:', this.typeForm);
      console.log('[ReportFormComponent] detailsForm:', this.detailsForm);

      this.setupAutocomplete();
      console.log('[ReportFormComponent] Autocomplete setup complete');
    } catch (error) {
      console.error('[ReportFormComponent] Error during initialization:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form groups
   */
  private initializeForms(): void {
    console.log('[ReportFormComponent] initializeForms called');
    console.log('[ReportFormComponent] FormBuilder:', this.fb);

    try {
      this.typeForm = this.fb.group({
        report_type: ['', Validators.required]
      });
      console.log('[ReportFormComponent] typeForm created:', this.typeForm.valid);

      this.detailsForm = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
        description: ['', [Validators.required, Validators.minLength(20)]],
        route_id: [this.prefilledRouteId || ''],
        route_search: [''],
        stop_id: [this.prefilledStopId || ''],
        stop_search: [''],
        location: ['']
      });
      console.log('[ReportFormComponent] detailsForm created:', this.detailsForm.valid);
    } catch (error) {
      console.error('[ReportFormComponent] Form creation error:', error);
      throw error;
    }
  }

  /**
   * Setup autocomplete for routes and stops
   */
  private setupAutocomplete(): void {
    // Routes autocomplete
    this.routes$ = this.detailsForm.get('route_search')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        if (!search || typeof search !== 'string') {
          return of([]);
        }
        return this.routesService.getRoutes({ search, limit: 10 }).pipe(
          map(response => response.data)
        );
      }),
      takeUntil(this.destroy$)
    );

    // Stops autocomplete
    this.stops$ = this.detailsForm.get('stop_search')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        if (!search || typeof search !== 'string') {
          return of([]);
        }
        // For now, get all stops and filter client-side
        // Backend could be enhanced with search parameter
        return this.stopsService.getStops({ limit: 50 }).pipe(
          map(stops => stops.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase())
          ))
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Handle report type selection
   */
  onTypeSelected(type: ReportType): void {
    this.typeForm.patchValue({ report_type: type });
  }

  /**
   * Handle route selection from autocomplete
   */
  onRouteSelected(route: Route): void {
    this.detailsForm.patchValue({ route_id: route.id });
  }

  /**
   * Handle stop selection from autocomplete
   */
  onStopSelected(stop: Stop): void {
    this.detailsForm.patchValue({ stop_id: stop.id });
  }

  /**
   * Display function for route autocomplete
   */
  displayRoute(route: Route): string {
    return route ? `${route.route_number} - ${route.name}` : '';
  }

  /**
   * Display function for stop autocomplete
   */
  displayStop(stop: Stop): string {
    return stop ? stop.name : '';
  }

  /**
   * Handle photos change
   */
  onPhotosChange(photos: File[]): void {
    this.selectedPhotos = photos;
  }

  /**
   * Handle photo upload error
   */
  onPhotoError(error: string): void {
    this.snackBar.open(error, 'Bezár', { duration: 5000, panelClass: 'error-snackbar' });
  }

  /**
   * Get character count for title
   */
  get titleCharCount(): number {
    return this.detailsForm.get('title')?.value?.length || 0;
  }

  /**
   * Get character count for description
   */
  get descriptionCharCount(): number {
    return this.detailsForm.get('description')?.value?.length || 0;
  }

  /**
   * Submit the report
   */
  async onSubmit(): Promise<void> {
    if (this.typeForm.invalid || this.detailsForm.invalid) {
      this.snackBar.open('Kérlek töltsd ki helyesen az összes kötelező mezőt', 'Bezár', { duration: 5000, panelClass: 'error-snackbar' });
      return;
    }

    this.isSubmitting = true;

    try {
      // Prepare report DTO
      const dto: CreateReportDto = {
        report_type: this.typeForm.value.report_type,
        title: this.detailsForm.value.title,
        description: this.detailsForm.value.description,
        route_id: this.detailsForm.value.route_id || undefined,
        stop_id: this.detailsForm.value.stop_id || undefined,
        location: this.detailsForm.value.location || undefined
      };

      // Create report
      const report = await this.reportsService.createReport(dto).toPromise();

      if (!report) {
        throw new Error('Failed to create report');
      }

      // Upload photos if any
      if (this.selectedPhotos.length > 0) {
        try {
          const photoUrls = await this.uploadPhotos(report.id);
          await this.reportsService.uploadPhotos(report.id, photoUrls).toPromise();
        } catch (photoError) {
          console.error('Photo upload failed:', photoError);
          this.snackBar.open(
            'Bejelentés létrehozva, de a fényképek feltöltése sikertelen. Később hozzáadhatod őket.',
            'Bezár',
            { duration: 7000, panelClass: 'warning-snackbar' }
          );
        }
      }

      const referenceNumber = this.reportsService.formatReferenceNumber(report.id);
      this.snackBar.open(
        `Bejelentés sikeresen elküldve! Hivatkozási szám: ${referenceNumber}`,
        'Bezár',
        { duration: 7000, panelClass: 'success-snackbar' }
      );

      this.submitted.emit({ reportId: report.id, referenceNumber });
      this.resetForm();
    } catch (error: any) {
      console.error('Report submission error:', error);

      // Handle rate limit error
      if (error.status === 429) {
        this.snackBar.open(
          'Elérted a bejelentési limitet. Kérlek próbáld újra később.',
          'Bezár',
          { duration: 7000, panelClass: 'error-snackbar' }
        );
      } else {
        this.snackBar.open(
          error.error?.message || 'Nem sikerült elküldeni a bejelentést. Próbáld újra.',
          'Bezár',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Upload photos to Supabase storage
   */
  private async uploadPhotos(reportId: string): Promise<string[]> {
    const photoUrls: string[] = [];

    for (const photo of this.selectedPhotos) {
      const fileName = `${reportId}/${Date.now()}_${photo.name}`;
      const { data, error } = await this.supabaseService.client
        .storage
        .from('report-photos')
        .upload(fileName, photo, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = this.supabaseService.client
        .storage
        .from('report-photos')
        .getPublicUrl(fileName);

      photoUrls.push(urlData.publicUrl);
    }

    return photoUrls;
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    this.typeForm.reset();
    this.detailsForm.reset();
    this.selectedPhotos = [];
  }

  /**
   * Cancel form submission
   */
  onCancel(): void {
    this.cancelled.emit();
  }
}
