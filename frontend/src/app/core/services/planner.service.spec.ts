import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  PlannerService,
  PlanTripDto,
  TripSearchResponse,
  Route,
  RouteStep,
  Stop,
  isTransitStep,
  isWalkingStep
} from './planner.service';
import { environment } from '@environments/environment';

describe('PlannerService', () => {
  let service: PlannerService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/planner`;

  // Mock data
  const mockStop1: Stop = {
    id: 'stop-1',
    name: 'Keleti pályaudvar M',
    latitude: 47.5,
    longitude: 19.1,
    type: 'metro',
    is_accessible: true,
    description: 'Metro station'
  };

  const mockStop2: Stop = {
    id: 'stop-2',
    name: 'Deák Ferenc tér M',
    latitude: 47.498,
    longitude: 19.054,
    type: 'metro',
    is_accessible: true,
    description: 'Transfer station'
  };

  const mockStop3: Stop = {
    id: 'stop-3',
    name: 'Astoria M',
    latitude: 47.494,
    longitude: 19.065,
    type: 'metro',
    is_accessible: true,
    description: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlannerService]
    });
    service = TestBed.inject(PlannerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ============================================================================
  // Service Creation
  // ============================================================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // searchRoute Method Tests
  // ============================================================================

  describe('searchRoute', () => {
    it('should search for routes with default parameters', () => {
      const mockResponse: TripSearchResponse = {
        alternatives: [
          {
            route_id: 'route-1',
            total_time: 28,
            transfers: 1,
            walking_distance: 450,
            total_stops: 12,
            steps: [],
            recommended: true,
            recommendation_reason: 'fastest'
          }
        ],
        search_timestamp: '2025-11-10T14:30:00Z',
        computation_time_ms: 342
      };

      const dto: PlanTripDto = {
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-2'
      };

      service.searchRoute(dto).subscribe(response => {
        expect(response.alternatives.length).toBe(1);
        expect(response.alternatives[0].recommended).toBe(true);
        expect(response.computation_time_ms).toBe(342);
      });

      const req = httpMock.expectOne(`${apiUrl}/search`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.include_walking).toBe(true); // Default value
      expect(req.request.body.max_alternatives).toBe(3);   // Default value
      expect(req.request.body.preference).toBe('fastest'); // Default value
      req.flush(mockResponse);
    });

    it('should use custom parameters when provided', () => {
      const dto: PlanTripDto = {
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-2',
        date: '2025-11-10',
        time: '14:00',
        include_walking: false,
        max_alternatives: 5,
        preference: 'least_transfers'
      };

      service.searchRoute(dto).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/search`);
      expect(req.request.body.include_walking).toBe(false);
      expect(req.request.body.max_alternatives).toBe(5);
      expect(req.request.body.preference).toBe('least_transfers');
      expect(req.request.body.date).toBe('2025-11-10');
      expect(req.request.body.time).toBe('14:00');
      req.flush({ alternatives: [], search_timestamp: '', computation_time_ms: 0 });
    });

    it('should return multiple alternative routes', () => {
      const mockResponse: TripSearchResponse = {
        alternatives: [
          {
            route_id: 'route-1',
            total_time: 25,
            transfers: 0,
            walking_distance: 600,
            total_stops: 8,
            steps: [],
            recommended: true,
            recommendation_reason: 'fastest'
          },
          {
            route_id: 'route-2',
            total_time: 30,
            transfers: 1,
            walking_distance: 200,
            total_stops: 12,
            steps: []
          },
          {
            route_id: 'route-3',
            total_time: 28,
            transfers: 0,
            walking_distance: 800,
            total_stops: 10,
            steps: []
          }
        ],
        search_timestamp: '2025-11-10T14:30:00Z',
        computation_time_ms: 456
      };

      const dto: PlanTripDto = {
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-3',
        max_alternatives: 3
      };

      service.searchRoute(dto).subscribe(response => {
        expect(response.alternatives.length).toBe(3);
        expect(response.alternatives[0].recommended).toBe(true);
        expect(response.alternatives[1].recommended).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/search`);
      req.flush(mockResponse);
    });

    // ============================================================================
    // Error Handling Tests
    // ============================================================================

    it('should handle 404 error gracefully', () => {
      const dto: PlanTripDto = {
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-2'
      };

      service.searchRoute(dto).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Nem található útvonal');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/search`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 400 error gracefully', () => {
      const dto: PlanTripDto = {
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-2'
      };

      service.searchRoute(dto).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Érvénytelen kérés');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/search`);
      req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle network error gracefully', () => {
      const dto: PlanTripDto = {
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-2'
      };

      service.searchRoute(dto).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Nem sikerült csatlakozni');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/search`);
      req.error(new ProgressEvent('error'), { status: 0 });
    });

    it('should handle 500 error gracefully', () => {
      const dto: PlanTripDto = {
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-2'
      };

      service.searchRoute(dto).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Szerverhiba');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/search`);
      req.flush({ message: 'Internal error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ============================================================================
  // Helper Methods - Calculations
  // ============================================================================

  describe('calculateWalkingDistance', () => {
    it('should calculate total walking distance correctly', () => {
      const route: Route = {
        route_id: 'r1',
        total_time: 30,
        transfers: 1,
        walking_distance: 600,
        total_stops: 10,
        steps: [
          {
            type: 'walking',
            start_stop: mockStop1,
            end_stop: mockStop2,
            distance: 300,
            duration: 4,
            stop_count: 0,
            stops: []
          } as RouteStep,
          {
            type: 'transit',
            start_stop: mockStop2,
            end_stop: mockStop3,
            route_id: 'route-123',
            route_number: 'M2',
            vehicle_type: 'metro',
            duration: 20,
            stop_count: 5,
            stops: []
          } as RouteStep,
          {
            type: 'walking',
            start_stop: mockStop3,
            end_stop: mockStop1,
            distance: 300,
            duration: 4,
            stop_count: 0,
            stops: []
          } as RouteStep
        ]
      };

      expect(service.calculateWalkingDistance(route)).toBe(600);
    });

    it('should return 0 for routes without walking', () => {
      const route: Route = {
        route_id: 'r1',
        total_time: 30,
        transfers: 0,
        walking_distance: 0,
        total_stops: 10,
        steps: [
          {
            type: 'transit',
            start_stop: mockStop1,
            end_stop: mockStop2,
            route_id: 'route-123',
            route_number: '7',
            vehicle_type: 'bus',
            duration: 30,
            stop_count: 10,
            stops: []
          } as RouteStep
        ]
      };

      expect(service.calculateWalkingDistance(route)).toBe(0);
    });
  });

  describe('hasWalking', () => {
    it('should return true for routes with walking', () => {
      const route: Route = {
        route_id: 'r1',
        total_time: 30,
        transfers: 1,
        walking_distance: 300,
        total_stops: 10,
        steps: [
          {
            type: 'walking',
            start_stop: mockStop1,
            end_stop: mockStop2,
            distance: 300,
            duration: 4,
            stop_count: 0,
            stops: []
          } as RouteStep,
          {
            type: 'transit',
            start_stop: mockStop2,
            end_stop: mockStop3,
            route_id: 'route-123',
            duration: 20,
            stop_count: 5,
            stops: []
          } as RouteStep
        ]
      };

      expect(service.hasWalking(route)).toBe(true);
    });

    it('should return false for routes without walking', () => {
      const route: Route = {
        route_id: 'r1',
        total_time: 30,
        transfers: 0,
        walking_distance: 0,
        total_stops: 10,
        steps: [
          {
            type: 'transit',
            start_stop: mockStop1,
            end_stop: mockStop2,
            route_id: 'route-123',
            duration: 30,
            stop_count: 10,
            stops: []
          } as RouteStep
        ]
      };

      expect(service.hasWalking(route)).toBe(false);
    });
  });

  describe('countTransitSteps', () => {
    it('should count transit steps correctly', () => {
      const route: Route = {
        route_id: 'r1',
        total_time: 30,
        transfers: 1,
        walking_distance: 300,
        total_stops: 10,
        steps: [
          { type: 'walking', duration: 4, stop_count: 0 } as RouteStep,
          { type: 'transit', duration: 10, stop_count: 5 } as RouteStep,
          { type: 'walking', duration: 3, stop_count: 0 } as RouteStep,
          { type: 'transit', duration: 15, stop_count: 8 } as RouteStep
        ]
      };

      expect(service.countTransitSteps(route)).toBe(2);
    });
  });

  // ============================================================================
  // Helper Methods - UI Display
  // ============================================================================

  describe('getStepIcon', () => {
    it('should return correct icon for walking', () => {
      const step: RouteStep = {
        type: 'walking',
        start_stop: mockStop1,
        end_stop: mockStop2,
        distance: 300,
        duration: 4,
        stop_count: 0,
        stops: []
      };
      expect(service.getStepIcon(step)).toBe('directions_walk');
    });

    it('should return correct icon for bus', () => {
      const step: RouteStep = {
        type: 'transit',
        start_stop: mockStop1,
        end_stop: mockStop2,
        route_id: 'route-123',
        vehicle_type: 'bus',
        duration: 10,
        stop_count: 5,
        stops: []
      };
      expect(service.getStepIcon(step)).toBe('directions_bus');
    });

    it('should return correct icon for tram', () => {
      const step: RouteStep = {
        type: 'transit',
        start_stop: mockStop1,
        end_stop: mockStop2,
        route_id: 'route-123',
        vehicle_type: 'tram',
        duration: 10,
        stop_count: 5,
        stops: []
      };
      expect(service.getStepIcon(step)).toBe('tram');
    });

    it('should return correct icon for metro', () => {
      const step: RouteStep = {
        type: 'transit',
        start_stop: mockStop1,
        end_stop: mockStop2,
        route_id: 'route-123',
        vehicle_type: 'metro',
        duration: 10,
        stop_count: 5,
        stops: []
      };
      expect(service.getStepIcon(step)).toBe('subway');
    });

    it('should return default icon for unknown type', () => {
      const step: RouteStep = {
        type: 'transit',
        start_stop: mockStop1,
        end_stop: mockStop2,
        route_id: 'route-123',
        duration: 10,
        stop_count: 5,
        stops: []
      };
      expect(service.getStepIcon(step)).toBe('directions_transit');
    });
  });

  describe('getVehicleTypeColor', () => {
    it('should return correct color for bus (Design System)', () => {
      expect(service.getVehicleTypeColor('bus')).toBe('#FF5722');
    });

    it('should return correct color for tram (Design System)', () => {
      expect(service.getVehicleTypeColor('tram')).toBe('#FFC107');
    });

    it('should return correct color for metro (Design System)', () => {
      expect(service.getVehicleTypeColor('metro')).toBe('#3F51B5');
    });

    it('should return grey for walking/unknown', () => {
      expect(service.getVehicleTypeColor()).toBe('#757575');
    });
  });

  describe('formatWalkingDistance', () => {
    it('should format meters correctly', () => {
      expect(service.formatWalkingDistance(450)).toBe('450 m');
      expect(service.formatWalkingDistance(999)).toBe('999 m');
    });

    it('should format kilometers correctly', () => {
      expect(service.formatWalkingDistance(1000)).toBe('1.0 km');
      expect(service.formatWalkingDistance(1500)).toBe('1.5 km');
      expect(service.formatWalkingDistance(2350)).toBe('2.4 km');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes correctly', () => {
      expect(service.formatDuration(25)).toBe('25 perc');
      expect(service.formatDuration(59)).toBe('59 perc');
    });

    it('should format hours and minutes correctly', () => {
      expect(service.formatDuration(60)).toBe('1ó 0p');
      expect(service.formatDuration(90)).toBe('1ó 30p');
      expect(service.formatDuration(125)).toBe('2ó 5p');
    });
  });

  describe('getRecommendationText', () => {
    it('should return Hungarian translation for recommendation reason', () => {
      expect(service.getRecommendationText('fastest')).toBe('Leggyorsabb');
      expect(service.getRecommendationText('least_transfers')).toBe('Legkevesebb átszállás');
      expect(service.getRecommendationText('least_walking')).toBe('Legkevesebb gyaloglás');
      expect(service.getRecommendationText('balanced')).toBe('Kiegyensúlyozott');
    });

    it('should return original text for unknown reason', () => {
      expect(service.getRecommendationText('custom_reason')).toBe('custom_reason');
    });

    it('should return empty string for undefined', () => {
      expect(service.getRecommendationText()).toBe('');
    });
  });

  describe('getStepTypeText', () => {
    it('should return Hungarian text for walking', () => {
      const step: RouteStep = {
        type: 'walking',
        start_stop: mockStop1,
        end_stop: mockStop2,
        distance: 300,
        duration: 4,
        stop_count: 0,
        stops: []
      };
      expect(service.getStepTypeText(step)).toBe('Gyaloglás');
    });

    it('should return Hungarian text for bus', () => {
      const step: RouteStep = {
        type: 'transit',
        start_stop: mockStop1,
        end_stop: mockStop2,
        vehicle_type: 'bus',
        duration: 10,
        stop_count: 5,
        stops: []
      };
      expect(service.getStepTypeText(step)).toBe('Busz');
    });

    it('should return Hungarian text for tram', () => {
      const step: RouteStep = {
        type: 'transit',
        start_stop: mockStop1,
        end_stop: mockStop2,
        vehicle_type: 'tram',
        duration: 10,
        stop_count: 5,
        stops: []
      };
      expect(service.getStepTypeText(step)).toBe('Villamos');
    });

    it('should return Hungarian text for metro', () => {
      const step: RouteStep = {
        type: 'transit',
        start_stop: mockStop1,
        end_stop: mockStop2,
        vehicle_type: 'metro',
        duration: 10,
        stop_count: 5,
        stops: []
      };
      expect(service.getStepTypeText(step)).toBe('Metró');
    });
  });

  // ============================================================================
  // Type Guards
  // ============================================================================

  describe('Type Guards', () => {
    it('isTransitStep should identify transit steps correctly', () => {
      const transitStep: RouteStep = {
        type: 'transit',
        start_stop: mockStop1,
        end_stop: mockStop2,
        route_id: 'route-123',
        route_number: '7',
        vehicle_type: 'bus',
        duration: 10,
        stop_count: 5,
        stops: []
      };

      const walkingStep: RouteStep = {
        type: 'walking',
        start_stop: mockStop1,
        end_stop: mockStop2,
        distance: 300,
        duration: 4,
        stop_count: 0,
        stops: []
      };

      expect(isTransitStep(transitStep)).toBe(true);
      expect(isTransitStep(walkingStep)).toBe(false);
    });

    it('isWalkingStep should identify walking steps correctly', () => {
      const transitStep: RouteStep = {
        type: 'transit',
        start_stop: mockStop1,
        end_stop: mockStop2,
        route_id: 'route-123',
        route_number: '7',
        vehicle_type: 'bus',
        duration: 10,
        stop_count: 5,
        stops: []
      };

      const walkingStep: RouteStep = {
        type: 'walking',
        start_stop: mockStop1,
        end_stop: mockStop2,
        distance: 300,
        duration: 4,
        stop_count: 0,
        stops: []
      };

      expect(isWalkingStep(walkingStep)).toBe(true);
      expect(isWalkingStep(transitStep)).toBe(false);
    });
  });
});
