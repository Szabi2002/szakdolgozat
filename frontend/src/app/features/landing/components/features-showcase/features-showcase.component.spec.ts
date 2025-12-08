import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesShowcaseComponent } from './features-showcase.component';
import { MaterialModule } from '@shared/material/material.module';

describe('FeaturesShowcaseComponent', () => {
  let component: FeaturesShowcaseComponent;
  let fixture: ComponentFixture<FeaturesShowcaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesShowcaseComponent, MaterialModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesShowcaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 3 features', () => {
    expect(component.features.length).toBe(3);
  });

  it('should render all feature cards', () => {
    const compiled = fixture.nativeElement;
    const cards = compiled.querySelectorAll('.feature-card');
    expect(cards.length).toBe(3);
  });

  it('should render section heading', () => {
    const compiled = fixture.nativeElement;
    const heading = compiled.querySelector('.features-heading');
    expect(heading.textContent).toContain('Miért válaszd');
  });
});
