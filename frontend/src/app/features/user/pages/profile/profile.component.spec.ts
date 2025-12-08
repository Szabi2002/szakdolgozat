import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/user.model';
import { MaterialModule } from '@shared/material/material.module';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    profile_picture_url: 'https://example.com/avatar.jpg',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser'], {
      currentUser$: of(mockUser)
    });
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MaterialModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with user data', () => {
    expect(component.profileForm.value.name).toBe(mockUser.name);
    expect(component.profileForm.value.email).toBe(mockUser.email);
    expect(component.profileForm.value.profile_picture_url).toBe(mockUser.profile_picture_url);
  });

  it('should validate required name field', () => {
    const nameControl = component.profileForm.get('name');
    nameControl?.setValue('');
    expect(nameControl?.hasError('required')).toBeTruthy();
  });

  it('should disable save button when form is pristine', () => {
    expect(component.canSave()).toBeFalsy();
  });

  it('should enable save button when form is dirty and valid', () => {
    component.profileForm.get('name')?.setValue('New Name');
    component.profileForm.markAsDirty();
    expect(component.canSave()).toBeTruthy();
  });

  it('should display user avatar when profile_picture_url exists', () => {
    const compiled = fixture.nativeElement;
    const avatar = compiled.querySelector('.user-avatar');
    expect(avatar).toBeTruthy();
  });
});
