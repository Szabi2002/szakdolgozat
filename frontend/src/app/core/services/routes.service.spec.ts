import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoutesService, Route, RouteDetails, CreateRouteDto, UpdateRouteDto } from './routes.service';
import { environment } from '@environments/environment';

describe('RoutesService', () => {
  let service: RoutesService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/routes`;

  const mockRoute: Route = {
    id: '1',
    route_number: '7',
    name: 'Keleti pályaudvar - Bosnyák tér',
    provider_id: 'bkk',
    is_accessible: true,
    is_active: true,
    stops_count: 15,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockRouteDetails: RouteDetails = {
    ...mockRoute,
    route_stops: [
      {
        id: '1',
        order: 1,
        arrival_time: '08:00',
        stops: {
          id: 's1',
          name: 'Keleti pályaudvar',
          latitude: 47.4979,
          longitude: 19.0402,
          type: 'tram',
          is_accessible: true
        }
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RoutesService]
    });
    service = TestBed.inject(RoutesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRoutes', () => {
    it('should fetch routes with pagination', () => {
      const mockResponse = {
        data: [mockRoute],
        total: 1,
        page: 1,
        limit: 10
      };

      service.getRoutes({ page: 1, limit: 10 }).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.data[0]).toEqual(mockRoute);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(request => 
        request.url === apiUrl && 
        request.params.has('page') && 
        request.params.has('limit')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch routes with search filter', () => {
      const mockResponse = {
        data: [mockRoute],
        total: 1,
        page: 1,
        limit: 10
      };

      service.getRoutes({ search: '7' }).subscribe();

      const req = httpMock.expectOne(request => 
        request.url === apiUrl && request.params.get('search') === '7'
      );
      req.flush(mockResponse);
    });
  });

  describe('getRoute', () => {
    it('should fetch a single route with stops', () => {
      service.getRoute('1').subscribe(route => {
        expect(route).toEqual(mockRouteDetails);
        expect(route.route_stops.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRouteDetails);
    });
  });

  describe('createRoute', () => {
    it('should create a new route', () => {
      const createDto: CreateRouteDto = {
        route_number: '7',
        name: 'Keleti pályaudvar - Bosnyák tér',
        is_accessible: true
      };

      service.createRoute(createDto).subscribe(route => {
        expect(route).toEqual(mockRoute);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockRoute);
    });
  });

  describe('updateRoute', () => {
    it('should update an existing route', () => {
      const updateDto: UpdateRouteDto = {
        name: 'Updated Name',
        is_active: false
      };

      service.updateRoute('1', updateDto).subscribe(route => {
        expect(route.id).toBe('1');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockRoute);
    });
  });

  describe('deleteRoute', () => {
    it('should delete a route', () => {
      service.deleteRoute('1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('assignStops', () => {
    it('should assign stops to a route', () => {
      const stops = [
        { stop_id: 's1', order: 1, arrival_time: '08:00' },
        { stop_id: 's2', order: 2, arrival_time: '08:05' }
      ];

      service.assignStops('1', stops).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1/stops`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ stops });
      req.flush(null);
    });
  });

  describe('getRouteStops', () => {
    it('should fetch route stops', () => {
      service.getRouteStops('1').subscribe(stops => {
        expect(stops.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/stops`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRouteDetails.route_stops);
    });
  });

  describe('toggleRouteStatus', () => {
    it('should toggle route active status', () => {
      service.toggleRouteStatus('1', false).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ is_active: false });
      req.flush(mockRoute);
    });
  });
});
