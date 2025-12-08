import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FavoritesService } from './favorites.service';
import { FavoriteRoute, CreateFavoriteDto, UpdateFavoriteDto } from '@core/models/favorite-route.model';
import { environment } from '@environments/environment';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/favorites`;

  const mockFavorite: FavoriteRoute = {
    id: '1',
    user_id: 'user-123',
    name: 'Home to Work',
    from_stop_id: 'stop-1',
    to_stop_id: 'stop-2',
    route_data: {},
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    from_stop: {
      id: 'stop-1',
      name: 'Stop 1',
      latitude: 47.5,
      longitude: 19.0
    },
    to_stop: {
      id: 'stop-2',
      name: 'Stop 2',
      latitude: 47.6,
      longitude: 19.1
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FavoritesService]
    });
    service = TestBed.inject(FavoritesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFavorites', () => {
    it('should retrieve all favorites', (done) => {
      const mockFavorites = [mockFavorite];

      service.getFavorites().subscribe(favorites => {
        expect(favorites).toEqual(mockFavorites);
        expect(favorites.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockFavorites);
    });

    it('should update loading state', (done) => {
      const mockFavorites = [mockFavorite];
      const loadingStates: boolean[] = [];

      service.loading$.subscribe(loading => {
        loadingStates.push(loading);
      });

      service.getFavorites().subscribe(() => {
        expect(loadingStates).toContain(true);
        expect(loadingStates[loadingStates.length - 1]).toBe(false);
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(mockFavorites);
    });

    it('should handle errors', (done) => {
      service.getFavorites().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Error');
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getFavorite', () => {
    it('should retrieve a single favorite by ID', (done) => {
      service.getFavorite('1').subscribe(favorite => {
        expect(favorite).toEqual(mockFavorite);
        expect(favorite.id).toBe('1');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFavorite);
    });

    it('should handle 404 error', (done) => {
      service.getFavorite('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('not found');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/999`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createFavorite', () => {
    it('should create a new favorite', (done) => {
      const createDto: CreateFavoriteDto = {
        name: 'New Favorite',
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-2',
        route_data: {}
      };

      service.createFavorite(createDto).subscribe(favorite => {
        expect(favorite).toEqual(mockFavorite);
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockFavorite);
    });

    it('should update favorites list after creation', (done) => {
      const createDto: CreateFavoriteDto = {
        name: 'New Favorite',
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-2'
      };

      service.createFavorite(createDto).subscribe(() => {
        service.favorites$.subscribe(favorites => {
          expect(favorites.length).toBeGreaterThan(0);
          expect(favorites[0]).toEqual(mockFavorite);
          done();
        });
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(mockFavorite);
    });

    it('should handle 409 error (max limit reached)', (done) => {
      const createDto: CreateFavoriteDto = {
        name: 'Too Many',
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-2'
      };

      service.createFavorite(createDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('maximum limit');
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('updateFavorite', () => {
    it('should update a favorite', (done) => {
      const updateDto: UpdateFavoriteDto = {
        name: 'Updated Name'
      };
      const updatedFavorite = { ...mockFavorite, name: 'Updated Name' };

      service.updateFavorite('1', updateDto).subscribe(favorite => {
        expect(favorite.name).toBe('Updated Name');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateDto);
      req.flush(updatedFavorite);
    });
  });

  describe('deleteFavorite', () => {
    it('should delete a favorite', (done) => {
      service.deleteFavorite('1').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should update favorites list after deletion', (done) => {
      // First, add a favorite to the list
      service.createFavorite({
        name: 'Test',
        from_stop_id: 'stop-1',
        to_stop_id: 'stop-2'
      }).subscribe(() => {
        // Then delete it
        service.deleteFavorite('1').subscribe(() => {
          service.favorites$.subscribe(favorites => {
            expect(favorites.find(f => f.id === '1')).toBeUndefined();
            done();
          });
        });

        const deleteReq = httpMock.expectOne(`${apiUrl}/1`);
        deleteReq.flush(null);
      });

      const createReq = httpMock.expectOne(apiUrl);
      createReq.flush(mockFavorite);
    });
  });

  describe('hasReachedLimit', () => {
    it('should return false when under limit', () => {
      expect(service.hasReachedLimit()).toBe(false);
    });

    it('should return true when at limit', (done) => {
      const favorites = Array.from({ length: 20 }, (_, i) => ({
        ...mockFavorite,
        id: `${i}`,
        name: `Favorite ${i}`
      }));

      service.getFavorites().subscribe(() => {
        expect(service.hasReachedLimit()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(favorites);
    });
  });

  describe('getFavoritesCount', () => {
    it('should return the correct count', (done) => {
      const favorites = [mockFavorite, { ...mockFavorite, id: '2' }];

      service.getFavorites().subscribe(() => {
        expect(service.getFavoritesCount()).toBe(2);
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(favorites);
    });
  });

  describe('clearCache', () => {
    it('should clear favorites cache', (done) => {
      service.getFavorites().subscribe(() => {
        service.clearCache();
        service.favorites$.subscribe(favorites => {
          expect(favorites.length).toBe(0);
          done();
        });
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush([mockFavorite]);
    });
  });
});
