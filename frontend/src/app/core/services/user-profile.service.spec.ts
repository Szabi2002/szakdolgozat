import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserProfileService } from './user-profile.service';
import {
  UserProfile,
  UserStatistics,
  UpdateProfileDto,
  NotificationPreferences,
  UpdateNotificationPreferencesDto
} from '@core/models/user-profile.model';
import { environment } from '@environments/environment';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/users`;

  const mockProfile: UserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    display_name: 'Test User',
    preferred_language: 'hu',
    notification_preferences: {
      email_ticket_purchase: true,
      email_route_disruptions: true,
      email_promotional: false,
      push_enabled: false
    },
    last_login_at: '2025-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockStatistics: UserStatistics = {
    tickets_purchased: 10,
    active_tickets: 2,
    total_spent: 15000,
    favorites_count: 5,
    last_purchase_date: '2025-01-01T00:00:00Z',
    last_favorite_added: '2025-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserProfileService]
    });
    service = TestBed.inject(UserProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProfile', () => {
    it('should retrieve user profile', (done) => {
      service.getProfile().subscribe(profile => {
        expect(profile).toEqual(mockProfile);
        expect(profile.email).toBe('test@example.com');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);
    });

    it('should update loading state', (done) => {
      const loadingStates: boolean[] = [];

      service.loading$.subscribe(loading => {
        loadingStates.push(loading);
      });

      service.getProfile().subscribe(() => {
        expect(loadingStates).toContain(true);
        expect(loadingStates[loadingStates.length - 1]).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush(mockProfile);
    });

    it('should cache the profile', (done) => {
      service.getProfile().subscribe(() => {
        const cachedProfile = service.getCurrentProfile();
        expect(cachedProfile).toEqual(mockProfile);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush(mockProfile);
    });

    it('should handle 404 error', (done) => {
      service.getProfile().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('not found');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', (done) => {
      const updateDto: UpdateProfileDto = {
        display_name: 'Updated Name',
        preferred_language: 'en'
      };
      const updatedProfile = { ...mockProfile, ...updateDto };

      service.updateProfile(updateDto).subscribe(profile => {
        expect(profile.display_name).toBe('Updated Name');
        expect(profile.preferred_language).toBe('en');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateDto);
      req.flush(updatedProfile);
    });

    it('should update cached profile', (done) => {
      const updateDto: UpdateProfileDto = {
        display_name: 'Updated Name'
      };
      const updatedProfile = { ...mockProfile, display_name: 'Updated Name' };

      service.updateProfile(updateDto).subscribe(() => {
        const cachedProfile = service.getCurrentProfile();
        expect(cachedProfile?.display_name).toBe('Updated Name');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush(updatedProfile);
    });

    it('should handle validation errors', (done) => {
      const updateDto: UpdateProfileDto = {
        display_name: 'A' // Too short
      };

      service.updateProfile(updateDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Invalid');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', (done) => {
      const updateDto: UpdateNotificationPreferencesDto = {
        email_ticket_purchase: false,
        email_promotional: true
      };
      const updatedPreferences: NotificationPreferences = {
        email_ticket_purchase: false,
        email_route_disruptions: true,
        email_promotional: true,
        push_enabled: false
      };

      service.updateNotificationPreferences(updateDto).subscribe(preferences => {
        expect(preferences.email_ticket_purchase).toBe(false);
        expect(preferences.email_promotional).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/notification-preferences`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateDto);
      req.flush(updatedPreferences);
    });

    it('should update cached profile preferences', (done) => {
      // First load the profile
      service.getProfile().subscribe(() => {
        const updateDto: UpdateNotificationPreferencesDto = {
          email_promotional: true
        };
        const updatedPreferences: NotificationPreferences = {
          email_ticket_purchase: true,
          email_route_disruptions: true,
          email_promotional: true,
          push_enabled: false
        };

        service.updateNotificationPreferences(updateDto).subscribe(() => {
          const cachedProfile = service.getCurrentProfile();
          expect(cachedProfile?.notification_preferences.email_promotional).toBe(true);
          done();
        });

        const prefReq = httpMock.expectOne(`${apiUrl}/notification-preferences`);
        prefReq.flush(updatedPreferences);
      });

      const profileReq = httpMock.expectOne(`${apiUrl}/profile`);
      profileReq.flush(mockProfile);
    });
  });

  describe('getStatistics', () => {
    it('should retrieve user statistics', (done) => {
      service.getStatistics().subscribe(statistics => {
        expect(statistics).toEqual(mockStatistics);
        expect(statistics.tickets_purchased).toBe(10);
        expect(statistics.total_spent).toBe(15000);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/statistics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatistics);
    });

    it('should handle empty statistics', (done) => {
      const emptyStats: UserStatistics = {
        tickets_purchased: 0,
        active_tickets: 0,
        total_spent: 0,
        favorites_count: 0
      };

      service.getStatistics().subscribe(statistics => {
        expect(statistics.tickets_purchased).toBe(0);
        expect(statistics.total_spent).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/statistics`);
      req.flush(emptyStats);
    });
  });

  describe('getCurrentProfile', () => {
    it('should return null when no profile is cached', () => {
      const profile = service.getCurrentProfile();
      expect(profile).toBeNull();
    });

    it('should return cached profile', (done) => {
      service.getProfile().subscribe(() => {
        const profile = service.getCurrentProfile();
        expect(profile).toEqual(mockProfile);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush(mockProfile);
    });
  });

  describe('clearCache', () => {
    it('should clear profile cache', (done) => {
      service.getProfile().subscribe(() => {
        service.clearCache();
        const profile = service.getCurrentProfile();
        expect(profile).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush(mockProfile);
    });
  });

  describe('error handling', () => {
    it('should handle 401 unauthorized error', (done) => {
      service.getProfile().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('session has expired');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle server errors', (done) => {
      service.getProfile().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Server error');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
