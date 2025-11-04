import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { ApiService } from '@core/services/api.service';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['checkHealth']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        provideHttpClient(),
        provideAnimations(),
      ],
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load health status on init', () => {
    const mockHealth = {
      status: 'ok',
      timestamp: '2025-01-01T00:00:00.000Z',
      version: '1.0.0',
      services: {
        database: 'connected',
        storage: 'connected',
      },
    };

    apiServiceSpy.checkHealth.and.returnValue(of(mockHealth));

    component.ngOnInit();

    expect(apiServiceSpy.checkHealth).toHaveBeenCalled();
  });

  it('should handle health check error', () => {
    apiServiceSpy.checkHealth.and.returnValue(throwError(() => new Error('Network error')));

    component.ngOnInit();

    expect(component.loading).toBe(false);
    expect(component.health).toBeNull();
  });
});
