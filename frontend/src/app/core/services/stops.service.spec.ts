import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StopsService, StopDetails, CreateStopDto, UpdateStopDto } from './stops.service';
import { Stop } from './routes.service';
import { environment } from '@environments/environment';

describe('StopsService', () => {
  let service: StopsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/stops`;

  const mockStop: Stop = {
    id: 's1',
    name: 'Keleti pályaudvar',
    latitude: 47.4979,
    longitude: 19.0402,
    type: 'tram',
    is_accessible: true
  };

  const mockStopDetails: StopDetails = {
    ...mockStop,
    routes_count: 1,
    routes: [
      {
        id: 'r1',
        route_number: '7',
        name: 'Keleti pályaudvar - Bosnyák tér',
        stop_order: 1
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StopsService]
    });
    service = TestBed.inject(StopsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getStops', () => {
    it('should fetch stops without filters', () => {
      service.getStops().subscribe(stops => {
        expect(stops.length).toBe(1);
        expect(stops[0]).toEqual(mockStop);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      // Backend returns paginated response with { data: [], meta: {} }
      req.flush({
        data: [mockStop],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 }
      });
    });

    it('should fetch stops with bounding box filter', () => {
      const filter = {
        sw_lat: 47.4,
        sw_lng: 19.0,
        ne_lat: 47.5,
        ne_lng: 19.1
      };

      service.getStops(filter).subscribe();

      const req = httpMock.expectOne(request =>
        request.url === apiUrl &&
        request.params.get('sw_lat') === '47.4' &&
        request.params.get('ne_lat') === '47.5'
      );
      // Backend returns paginated response
      req.flush({
        data: [mockStop],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 }
      });
    });

    it('should fetch stops with type filter', () => {
      service.getStops({ type: 'tram' }).subscribe();

      const req = httpMock.expectOne(request =>
        request.url === apiUrl && request.params.get('type') === 'tram'
      );
      // Backend returns paginated response
      req.flush({
        data: [mockStop],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 }
      });
    });
  });

  describe('getStop', () => {
    it('should fetch a single stop with routes', () => {
      service.getStop('s1').subscribe(stop => {
        expect(stop).toEqual(mockStopDetails);
        expect(stop.routes?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/s1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStopDetails);
    });
  });

  describe('getNearbyStops', () => {
    it('should fetch nearby stops with default radius', () => {
      const params = { lat: 47.4979, lng: 19.0402 };

      service.getNearbyStops(params).subscribe(stops => {
        expect(stops.length).toBe(1);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${apiUrl}/nearby` &&
        request.params.get('lat') === '47.4979' &&
        request.params.get('lng') === '19.0402'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockStop]);
    });

    it('should fetch nearby stops with custom radius', () => {
      const params = { lat: 47.4979, lng: 19.0402, radius: 1000 };

      service.getNearbyStops(params).subscribe();

      const req = httpMock.expectOne(request =>
        request.url === `${apiUrl}/nearby` &&
        request.params.get('radius') === '1000'
      );
      req.flush([mockStop]);
    });
  });

  describe('createStop', () => {
    it('should create a new stop', () => {
      const createDto: CreateStopDto = {
        name: 'New Stop',
        latitude: 47.5,
        longitude: 19.1,
        type: 'bus',
        is_accessible: true
      };

      service.createStop(createDto).subscribe(stop => {
        expect(stop.name).toBe('New Stop');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush({ ...mockStop, ...createDto });
    });
  });

  describe('updateStop', () => {
    it('should update an existing stop', () => {
      const updateDto: UpdateStopDto = {
        name: 'Updated Stop Name',
        is_accessible: false
      };

      service.updateStop('s1', updateDto).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/s1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockStop);
    });
  });

  describe('deleteStop', () => {
    it('should delete a stop', () => {
      service.deleteStop('s1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/s1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getStopsInBounds', () => {
    it('should fetch stops within map bounds', () => {
      const bounds = {
        southwest: { lat: 47.4, lng: 19.0 },
        northeast: { lat: 47.5, lng: 19.1 }
      };

      service.getStopsInBounds(bounds).subscribe();

      const req = httpMock.expectOne(request =>
        request.url === apiUrl &&
        request.params.get('sw_lat') === '47.4' &&
        request.params.get('ne_lat') === '47.5'
      );
      // Backend returns paginated response
      req.flush({
        data: [mockStop],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 }
      });
    });
  });

  describe('getStopsByType', () => {
    it('should fetch stops filtered by type', () => {
      service.getStopsByType('metro').subscribe();

      const req = httpMock.expectOne(request =>
        request.url === apiUrl && request.params.get('type') === 'metro'
      );
      // Backend returns paginated response
      req.flush({
        data: [mockStop],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 }
      });
    });
  });
});
