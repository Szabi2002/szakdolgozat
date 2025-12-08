import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HeroSectionComponent } from './hero-section.component';
import { MaterialModule } from '@shared/material/material.module';

describe('HeroSectionComponent', () => {
  let component: HeroSectionComponent;
  let fixture: ComponentFixture<HeroSectionComponent>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HeroSectionComponent, MaterialModule, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(HeroSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render hero heading', () => {
    const compiled = fixture.nativeElement;
    const heading = compiled.querySelector('.hero-heading');
    expect(heading.textContent).toContain('Utazz egyszerűen');
  });

  it('should navigate to login when CTA button is clicked', () => {
    component.navigateToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should have two action buttons', () => {
    const compiled = fixture.nativeElement;
    const buttons = compiled.querySelectorAll('.hero-actions button');
    expect(buttons.length).toBe(2);
  });
});
