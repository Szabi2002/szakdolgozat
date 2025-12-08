import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordStrengthIndicatorComponent } from './password-strength-indicator.component';

describe('PasswordStrengthIndicatorComponent', () => {
  let component: PasswordStrengthIndicatorComponent;
  let fixture: ComponentFixture<PasswordStrengthIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordStrengthIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordStrengthIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate weak password strength', () => {
    component.password = 'weak';
    component.ngOnChanges({
      password: {
        currentValue: 'weak',
        previousValue: '',
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.strengthResult.strength).toBe('weak');
  });

  it('should calculate strong password strength', () => {
    component.password = 'StrongP@ss123';
    component.ngOnChanges({
      password: {
        currentValue: 'StrongP@ss123',
        previousValue: '',
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.strengthResult.strength).toBe('strong');
  });
});
