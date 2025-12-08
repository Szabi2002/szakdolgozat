import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UserProfileService } from '@core/services/user-profile.service';
import { UserProfile, UpdateProfileDto } from '@core/models/user-profile.model';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss']
})
export class ProfileInfoComponent implements OnInit, OnDestroy {
  @Input() profile!: UserProfile;

  profileForm!: FormGroup;
  saving = false;
  hasUnsavedChanges = false;

  languages = [
    { value: 'hu', label: 'Magyar' },
    { value: 'en', label: 'English' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly userProfileService: UserProfileService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      display_name: [
        this.profile.display_name || '',
        [Validators.maxLength(50)]
      ],
      preferred_language: [
        this.profile.preferred_language || 'hu',
        [Validators.required]
      ]
    });

    // Track form changes
    this.profileForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasUnsavedChanges = this.profileForm.dirty && this.profileForm.valid;
      });
  }

  private setupAutoSave(): void {
    // Auto-save on blur or after 2 seconds of no changes
    this.profileForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(2000),
        distinctUntilChanged((prev, curr) =>
          JSON.stringify(prev) === JSON.stringify(curr)
        )
      )
      .subscribe(() => {
        if (this.profileForm.valid && this.profileForm.dirty) {
          this.saveProfile();
        }
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.saving) {
      return;
    }

    this.saving = true;
    const dto: UpdateProfileDto = {
      display_name: this.profileForm.value.display_name?.trim() || undefined,
      preferred_language: this.profileForm.value.preferred_language
    };

    this.userProfileService.updateProfile(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedProfile) => {
          this.saving = false;
          this.hasUnsavedChanges = false;
          this.profileForm.markAsPristine();
          this.snackBar.open('Profil sikeresen frissítve!', 'Bezár', {
            duration: 3000,
            horizontalPosition: 'center'
          });
        },
        error: (error) => {
          this.saving = false;
          this.snackBar.open(
            error.message || 'Nem sikerült frissíteni a profilt. Kérlek próbáld újra.',
            'Bezár',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
  }

  onBlur(): void {
    // Save immediately on blur if there are changes
    if (this.profileForm.valid && this.profileForm.dirty && !this.saving) {
      this.saveProfile();
    }
  }

  getDisplayNameError(): string {
    const control = this.profileForm.get('display_name');
    if (control?.hasError('maxLength')) {
      return 'A megjelenített név maximum 50 karakter lehet';
    }
    return '';
  }
}
