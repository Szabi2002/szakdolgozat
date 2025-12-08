import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { TripPlannerComponent } from './trip-planner.component';
import { StopsService } from '@core/services/stops.service';
import { PlannerService, TripSearchResponse, Route, RouteStep, Stop as PlannerStop } from '@core/services/planner.service';
import { Stop } from '@core/services/routes.service';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

describe('TripPlannerComponent', () => {
  let component: TripPlannerComponent;
  let fixture: ComponentFixture<TripPlannerComponent>;
  let stopsService: jasmine.SpyObj<StopsService>;
  let plannerService: jasmine.SpyObj<PlannerService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let queryParamsSubject: BehaviorSubject<any>;

  const mockStops: Stop[] = [
    { id: 'stop-1', name: 'Keleti pályaudvar M', latitude: 47.5, longitude: 19.1, type: 'metro' as const, is_accessible: true },
    { id: 'stop-2', name: 'Deák Ferenc tér M', latitude: 47.49, longitude: 19.05, type: 'metro' as const, is_accessible: true }
  ];

  const mockPlannerStops: PlannerStop[] = [
    { id: 'stop-1', name: 'Keleti pályaudvar M', latitude: 47.5, longitude: 19.1, type: 'metro', is_accessible: true, description: null },
    { id: 'stop-2', name: 'Deák Ferenc tér M', latitude: 47.49, longitude: 19.05, type: 'metro', is_accessible: true, description: null }
  ];

  const mockRouteStep: RouteStep = {
    type: 'transit',
    start_stop: mockPlannerStops[0],
    end_stop: mockPlannerStops[1],
    route_id: 'route-1',
    route_number: '2',
    route_name: 'Örs vezér tere - Déli pályaudvar',
    vehicle_type: 'metro',
    duration: 5,
    stop_count: 3,
    stops: mockPlannerStops
  };

  const mockRoute: Route = {
    route_id: 'route-1',
    total_time: 5,
    transfers: 0,
    walking_distance: 0,
    total_stops: 3,
    steps: [mockRouteStep],
    recommended: true,
    recommendation_reason: 'Leggyorsabb'
  };

  const mockTripResult: TripSearchResponse = {
    alternatives: [mockRoute],
    search_timestamp: new Date().toISOString(),
    computation_time_ms: 150
  };

  beforeEach(async () => {
    const stopsServiceSpy = jasmine.createSpyObj('StopsService', ['getStops']);
    const plannerServiceSpy = jasmine.createSpyObj('PlannerService', ['searchRoute']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Initialize query params subject
    queryParamsSubject = new BehaviorSubject<any>({});

    await TestBed.configureTestingModule({
      imports: [
        TripPlannerComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: StopsService, useValue: stopsServiceSpy },
        { provide: PlannerService, useValue: plannerServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    stopsService = TestBed.inject(StopsService) as jasmine.SpyObj<StopsService>;
    plannerService = TestBed.inject(PlannerService) as jasmine.SpyObj<PlannerService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    stopsService.getStops.and.returnValue(of(mockStops));

    fixture = TestBed.createComponent(TripPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.plannerForm).toBeDefined();
    expect(component.plannerForm.get('fromStop')?.value).toBe('');
    expect(component.plannerForm.get('toStop')?.value).toBe('');
    expect(component.plannerForm.get('date')?.value).toBeInstanceOf(Date);
    expect(component.plannerForm.get('time')?.value).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should validate form - required fields', () => {
    expect(component.plannerForm.valid).toBeFalse();

    component.plannerForm.patchValue({
      fromStop: mockStops[0],
      toStop: mockStops[1]
    });

    expect(component.plannerForm.valid).toBeTrue();
  });

  it('should disable search button when form is invalid', () => {
    component.plannerForm.patchValue({
      fromStop: '',
      toStop: ''
    });

    expect(component.plannerForm.invalid).toBeTrue();
  });

  it('should call API and display results on successful search', (done) => {
    plannerService.searchRoute.and.returnValue(of(mockTripResult));

    component.plannerForm.patchValue({
      fromStop: mockStops[0],
      toStop: mockStops[1]
    });

    component.onSearch();

    expect(component.isLoading()).toBeTrue();

    setTimeout(() => {
      expect(plannerService.searchRoute).toHaveBeenCalledWith(
        jasmine.objectContaining({
          from_stop_id: 'stop-1',
          to_stop_id: 'stop-2'
        })
      );
      expect(component.alternatives().length).toBeGreaterThan(0);
      expect(component.selectedRoute()).toEqual(mockRoute);
      expect(component.isLoading()).toBeFalse();
      expect(component.searchPerformed()).toBeTrue();
      done();
    }, 10);
  });

  it('should handle API error gracefully', (done) => {
    const errorResponse = { message: 'Route not found' };
    plannerService.searchRoute.and.returnValue(throwError(() => errorResponse));

    component.plannerForm.patchValue({
      fromStop: mockStops[0],
      toStop: mockStops[1]
    });

    component.onSearch();

    setTimeout(() => {
      expect(component.isLoading()).toBeFalse();
      expect(component.searchPerformed()).toBeTrue();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Route not found',
        'OK',
        { duration: 5000 }
      );
      done();
    }, 10);
  });

  it('should show snackbar when no route is found', (done) => {
    const emptyResult: TripSearchResponse = {
      alternatives: [],
      search_timestamp: new Date().toISOString(),
      computation_time_ms: 100
    };

    plannerService.searchRoute.and.returnValue(of(emptyResult));

    component.plannerForm.patchValue({
      fromStop: mockStops[0],
      toStop: mockStops[1]
    });

    component.onSearch();

    setTimeout(() => {
      expect(snackBar.open).toHaveBeenCalledWith(
        'Nem található útvonal a megadott megállók között.',
        'OK',
        { duration: 5000 }
      );
      done();
    }, 10);
  });

  it('should filter stops based on search term', () => {
    const filtered = component['filterStops'](mockStops, 'Keleti');
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toContain('Keleti');
  });

  // Tests for Hungarian text normalization
  describe('Hungarian text normalization', () => {
    it('should normalize Hungarian characters correctly', () => {
      const testCases = [
        { input: 'Kelenföld', expected: 'Kelenfold' },
        { input: 'Örs vezér tere', expected: 'Ors vezer tere' },
        { input: 'Deák Ferenc tér', expected: 'Deak Ferenc ter' },
        { input: 'Kálvin tér', expected: 'Kalvin ter' },
        { input: 'Üllői út', expected: 'Ulloi ut' },
        { input: 'Átlós utca', expected: 'Atlos utca' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(component['normalizeHungarianText'](input)).toBe(expected);
      });
    });

    it('should filter stops with Hungarian character normalization', () => {
      const hungarianStops: Stop[] = [
        { id: '1', name: 'Kelenföld vasútállomás', latitude: 47.5, longitude: 19.1, type: 'metro', is_accessible: true },
        { id: '2', name: 'Örs vezér tere M', latitude: 47.5, longitude: 19.2, type: 'metro', is_accessible: true },
        { id: '3', name: 'Deák Ferenc tér M', latitude: 47.5, longitude: 19.05, type: 'metro', is_accessible: true }
      ];

      // Search without diacritics should find stop with diacritics
      let filtered = component['filterStops'](hungarianStops, 'Kelen');
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toContain('Kelenföld');

      // Search for "Ors" should find "Örs"
      filtered = component['filterStops'](hungarianStops, 'Ors');
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toContain('Örs');

      // Search for "Deak" should find "Deák"
      filtered = component['filterStops'](hungarianStops, 'Deak');
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toContain('Deák');
    });

    it('should prioritize stops that start with search term', () => {
      const testStops: Stop[] = [
        { id: '1', name: 'Arany János utca M', latitude: 47.5, longitude: 19.1, type: 'metro', is_accessible: true },
        { id: '2', name: 'Keleti pályaudvar', latitude: 47.5, longitude: 19.2, type: 'metro', is_accessible: true },
        { id: '3', name: 'Nyugati pályaudvar Arany', latitude: 47.5, longitude: 19.05, type: 'metro', is_accessible: true }
      ];

      const filtered = component['filterStops'](testStops, 'Arany');

      // "Arany János utca M" should come before "Nyugati pályaudvar Arany"
      expect(filtered[0].name).toBe('Arany János utca M');
      expect(filtered.length).toBe(2);
    });

    it('should sort results alphabetically when both match at start', () => {
      const testStops: Stop[] = [
        { id: '1', name: 'Kálvin tér', latitude: 47.5, longitude: 19.1, type: 'metro', is_accessible: true },
        { id: '2', name: 'Kelenföld vasútállomás', latitude: 47.5, longitude: 19.2, type: 'metro', is_accessible: true },
        { id: '3', name: 'Keleti pályaudvar', latitude: 47.5, longitude: 19.05, type: 'metro', is_accessible: true }
      ];

      const filtered = component['filterStops'](testStops, 'K');

      // All start with "K", should be alphabetically sorted
      expect(filtered[0].name).toBe('Kálvin tér');
      expect(filtered[1].name).toBe('Kelenföld vasútállomás');
      expect(filtered[2].name).toBe('Keleti pályaudvar');
    });

    it('should return empty array for no matches', () => {
      const filtered = component['filterStops'](mockStops, 'XYZABC123');
      expect(filtered.length).toBe(0);
    });

    it('should limit results to 15 stops', () => {
      const manyStops: Stop[] = Array.from({ length: 50 }, (_, i) => ({
        id: `stop-${i}`,
        name: `Arany utca ${i}`,
        latitude: 47.5,
        longitude: 19.1,
        type: 'bus' as const,
        is_accessible: true
      }));

      const filtered = component['filterStops'](manyStops, 'Arany');
      expect(filtered.length).toBe(15);
    });

    it('should be case insensitive', () => {
      const filtered1 = component['filterStops'](mockStops, 'keleti');
      const filtered2 = component['filterStops'](mockStops, 'KELETI');
      const filtered3 = component['filterStops'](mockStops, 'KeLeTi');

      expect(filtered1.length).toBe(filtered2.length);
      expect(filtered2.length).toBe(filtered3.length);
      expect(filtered1[0]?.id).toBe(filtered2[0]?.id);
    });
  });

  it('should display stop name correctly', () => {
    expect(component.displayStopFn(mockStops[0])).toBe('Keleti pályaudvar M');
    expect(component.displayStopFn('Test')).toBe('Test');
  });

  it('should prevent search with string values instead of Stop objects', () => {
    component.plannerForm.patchValue({
      fromStop: 'Invalid string',
      toStop: mockStops[1]
    });

    component.onSearch();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Kérem válasszon érvényes megállót a listából!',
      'OK',
      { duration: 3000 }
    );
    expect(plannerService.searchRoute).not.toHaveBeenCalled();
  });

  it('should select alternative route', () => {
    const alternativeRoute: Route = {
      ...mockRoute,
      route_id: 'route-2',
      recommended: false
    };

    component.alternatives.set([mockRoute, alternativeRoute]);
    component.selectAlternative(alternativeRoute);

    expect(component.selectedRoute()).toEqual(alternativeRoute);
  });

  // New tests for query parameter handling (BUG-004 fix)
  describe('Query parameter handling (Favorite selection)', () => {
    it('should load stops and pre-fill form when query params are provided', (done) => {
      const snackBarRef = jasmine.createSpyObj<MatSnackBarRef<any>>('MatSnackBarRef', ['onAction']);
      snackBarRef.onAction.and.returnValue(of({}));
      snackBar.open.and.returnValue(snackBarRef);

      // Simulate query params from favorite selection
      queryParamsSubject.next({
        from: 'stop-1',
        to: 'stop-2',
        favorite: 'fav-123'
      });

      setTimeout(() => {
        expect(stopsService.getStops).toHaveBeenCalled();
        expect(component.plannerForm.get('fromStop')?.value).toEqual(mockStops[0]);
        expect(component.plannerForm.get('toStop')?.value).toEqual(mockStops[1]);
        expect(component.fromStop()).toEqual(mockStops[0]);
        expect(component.toStop()).toEqual(mockStops[1]);
        expect(snackBar.open).toHaveBeenCalledWith(
          `Útvonal betöltve: ${mockStops[0].name} → ${mockStops[1].name}`,
          'Keresés',
          { duration: 5000 }
        );
        done();
      }, 100);
    });

    it('should handle error when stop is not found in query params', (done) => {
      // Simulate query params with invalid stop ID
      queryParamsSubject.next({
        from: 'invalid-stop-id',
        to: 'stop-2'
      });

      setTimeout(() => {
        expect(stopsService.getStops).toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith(
          'Hiba: Nem található a megadott megálló(k)',
          'OK',
          { duration: 3000 }
        );
        expect(component.plannerForm.get('fromStop')?.value).toBe('');
        expect(component.plannerForm.get('toStop')?.value).toBe('');
        done();
      }, 100);
    });

    it('should handle error when stops service fails during query param handling', (done) => {
      stopsService.getStops.and.returnValue(throwError(() => new Error('API Error')));

      // Simulate query params
      queryParamsSubject.next({
        from: 'stop-1',
        to: 'stop-2'
      });

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalledWith(
          'API Error',
          'OK',
          { duration: 3000 }
        );
        expect(component.isLoading()).toBeFalse();
        done();
      }, 100);
    });

    it('should not attempt to load stops when query params are missing', () => {
      const getStopsCalls = stopsService.getStops.calls.count();

      // Emit empty query params
      queryParamsSubject.next({});

      expect(stopsService.getStops.calls.count()).toBe(getStopsCalls);
    });

    it('should not attempt to load stops when only one query param is provided', () => {
      const getStopsCalls = stopsService.getStops.calls.count();

      // Only 'from' parameter
      queryParamsSubject.next({ from: 'stop-1' });

      expect(stopsService.getStops.calls.count()).toBe(getStopsCalls);
    });

    it('should set loading state correctly during query param handling', (done) => {
      const snackBarRef = jasmine.createSpyObj<MatSnackBarRef<any>>('MatSnackBarRef', ['onAction']);
      snackBarRef.onAction.and.returnValue(of({}));
      snackBar.open.and.returnValue(snackBarRef);

      expect(component.isLoading()).toBeFalse();

      queryParamsSubject.next({
        from: 'stop-1',
        to: 'stop-2'
      });

      // Loading should be true immediately
      expect(component.isLoading()).toBeTrue();

      setTimeout(() => {
        // Loading should be false after completion
        expect(component.isLoading()).toBeFalse();
        done();
      }, 100);
    });
  });
});
