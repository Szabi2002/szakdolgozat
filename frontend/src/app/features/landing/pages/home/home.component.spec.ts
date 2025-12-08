import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingHomeComponent } from './home.component';
import { HeroSectionComponent } from '../../components/hero-section/hero-section.component';
import { FeaturesShowcaseComponent } from '../../components/features-showcase/features-showcase.component';
import { CtaSectionComponent } from '../../components/cta-section/cta-section.component';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LandingHomeComponent', () => {
  let component: LandingHomeComponent;
  let fixture: ComponentFixture<LandingHomeComponent>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        LandingHomeComponent,
        HeroSectionComponent,
        FeaturesShowcaseComponent,
        CtaSectionComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all sections', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-hero-section')).toBeTruthy();
    expect(compiled.querySelector('app-features-showcase')).toBeTruthy();
    expect(compiled.querySelector('app-cta-section')).toBeTruthy();
  });
});
