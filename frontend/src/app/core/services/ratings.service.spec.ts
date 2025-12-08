import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RatingsService } from './ratings.service';
import { CreateRatingDto, Rating, RatingStats } from '../models/rating.model';
import { environment } from '../../../environments/environment';

describe('RatingsService', () => {
  let service: RatingsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/ratings`;

  const mockRating: Rating = {
    id: '1',
    user_id: 'user1',
    route_id: 'route1',
    rating_overall: 5,
    rating_cleanliness: 5,
    rating_punctuality: 4,
    rating_driver: 5,
    rating_comfort: 4,
    comment: 'Great route!',
    status: 'approved',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  };

  const mockStats: RatingStats = {
    route_id: 'route1',
    total_ratings: 10,
    avg_overall: 4.5,
    avg_cleanliness: 4.3,
    avg_punctuality: 4.2,
    avg_driver: 4.6,
    avg_comfort: 4.4,
    five_star_count: 5,
    four_star_count: 3,
    three_star_count: 1,
    two_star_count: 1,
    one_star_count: 0
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RatingsService]
    });
    service = TestBed.inject(RatingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createRating', () => {
    it('should create a new rating', () => {
      const dto: CreateRatingDto = {
        route_id: 'route1',
        rating_overall: 5,
        rating_cleanliness: 5,
        rating_punctuality: 4,
        rating_driver: 5,
        rating_comfort: 4,
        comment: 'Great route!'
      };

      service.createRating(dto).subscribe(rating => {
        expect(rating).toEqual(mockRating);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockRating);
    });
  });

  describe('getRatingsByRoute', () => {
    it('should fetch ratings for a specific route', () => {
      const routeId = 'route1';

      service.getRatingsByRoute(routeId).subscribe(ratings => {
        expect(ratings).toEqual([mockRating]);
      });

      const req = httpMock.expectOne(`${apiUrl}/route/${routeId}`);
      expect(req.request.method).toBe('GET');
      req.flush([mockRating]);
    });
  });

  describe('getRouteRatingStats', () => {
    it('should fetch rating statistics for a route', () => {
      const routeId = 'route1';

      service.getRouteRatingStats(routeId).subscribe(stats => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne(`${apiUrl}/route/${routeId}/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });

  describe('getMyRatings', () => {
    it('should fetch current user ratings', () => {
      service.getMyRatings().subscribe(ratings => {
        expect(ratings).toEqual([mockRating]);
      });

      const req = httpMock.expectOne(`${apiUrl}/my-ratings`);
      expect(req.request.method).toBe('GET');
      req.flush([mockRating]);
    });
  });

  describe('getRatingById', () => {
    it('should fetch a specific rating', () => {
      const ratingId = '1';

      service.getRatingById(ratingId).subscribe(rating => {
        expect(rating).toEqual(mockRating);
      });

      const req = httpMock.expectOne(`${apiUrl}/${ratingId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRating);
    });
  });

  describe('updateRating', () => {
    it('should update an existing rating', () => {
      const ratingId = '1';
      const updateDto = { rating_overall: 4, comment: 'Updated comment' };

      service.updateRating(ratingId, updateDto).subscribe(rating => {
        expect(rating).toEqual(mockRating);
      });

      const req = httpMock.expectOne(`${apiUrl}/${ratingId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockRating);
    });
  });

  describe('deleteRating', () => {
    it('should delete a rating', () => {
      const ratingId = '1';

      service.deleteRating(ratingId).subscribe(() => {
        expect().nothing();
      });

      const req = httpMock.expectOne(`${apiUrl}/${ratingId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('uploadPhotos', () => {
    it('should upload photos for a rating', () => {
      const ratingId = '1';
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockUrls = ['https://example.com/photo1.jpg'];

      service.uploadPhotos(ratingId, [mockFile]).subscribe(urls => {
        expect(urls).toEqual(mockUrls);
      });

      const req = httpMock.expectOne(`${apiUrl}/${ratingId}/photos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTruthy();
      req.flush({ urls: mockUrls });
    });
  });

  describe('deletePhoto', () => {
    it('should delete a photo from a rating', () => {
      const ratingId = '1';
      const photoId = 'photo1.jpg';

      service.deletePhoto(ratingId, photoId).subscribe(() => {
        expect().nothing();
      });

      const req = httpMock.expectOne(`${apiUrl}/${ratingId}/photos/${photoId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('moderateRating', () => {
    it('should moderate a rating', () => {
      const ratingId = '1';
      const moderateDto = { status: 'approved' as const };

      service.moderateRating(ratingId, moderateDto).subscribe(rating => {
        expect(rating).toEqual(mockRating);
      });

      const req = httpMock.expectOne(`${apiUrl}/${ratingId}/moderate`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(moderateDto);
      req.flush(mockRating);
    });
  });

  describe('getPendingRatings', () => {
    it('should fetch pending ratings', () => {
      service.getPendingRatings().subscribe(ratings => {
        expect(ratings).toEqual([mockRating]);
      });

      const req = httpMock.expectOne(`${apiUrl}/pending`);
      expect(req.request.method).toBe('GET');
      req.flush([mockRating]);
    });
  });

  describe('error handling', () => {
    it('should handle rate limit error', () => {
      const dto: CreateRatingDto = {
        route_id: 'route1',
        rating_overall: 5,
        rating_cleanliness: 5,
        rating_punctuality: 4,
        rating_driver: 5,
        rating_comfort: 4
      };

      service.createRating(dto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Rate limit exceeded');
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Too many requests' }, { status: 429, statusText: 'Too Many Requests' });
    });
  });
});
