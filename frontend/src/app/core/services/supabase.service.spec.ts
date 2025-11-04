import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupabaseService],
    });
    service = TestBed.inject(SupabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a Supabase client', () => {
    expect(service.client).toBeDefined();
  });

  it('should have user$ observable', () => {
    expect(service.user$).toBeDefined();
  });

  it('should initially have no user', () => {
    expect(service.user).toBeNull();
  });
});
