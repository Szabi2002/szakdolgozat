import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, HealthResponse } from './api.service';
import { environment } from '@environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check health', () => {
    const mockResponse: HealthResponse = {
      status: 'ok',
      timestamp: '2025-01-01T00:00:00.000Z',
      version: '1.0.0',
      services: {
        database: 'connected',
        storage: 'connected',
      },
    };

    service.checkHealth().subscribe(health => {
      expect(health).toEqual(mockResponse);
      expect(health.status).toBe('ok');
      expect(health.services.database).toBe('connected');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/health`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
