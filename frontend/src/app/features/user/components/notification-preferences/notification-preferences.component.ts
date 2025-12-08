import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { UserProfileService } from '@core/services/user-profile.service';
import { UserProfile, NotificationPreferences, UpdateNotificationPreferencesDto } from '@core/models/user-profile.model';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './notification-preferences.component.html',
  styleUrls: ['./notification-preferences.component.scss']
})
export class NotificationPreferencesComponent implements OnInit, OnDestroy {
  @Input() profile!: UserProfile;

  preferences: NotificationPreferences = {
    email_ticket_purchase: true,
    email_route_disruptions: true,
    email_promotional: false,
    push_enabled: false
  };

  saving = false;
  lastSavedTime: Date | null = null;

  private destroy$ = new Subject<void>();
  private saveSubject$ = new Subject<UpdateNotificationPreferencesDto>();

  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.profile?.notification_preferences) {
      this.preferences = { ...this.profile.notification_preferences };
    }

    // Setup auto-save with debounce
    this.saveSubject$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500) // Wait 500ms after last change
      )
      .subscribe(dto => {
        this.savePreferences(dto);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleChange(preference: keyof NotificationPreferences, checked: boolean): void {
    // Optimistic update
    this.preferences[preference] = checked;

    // Prepare DTO
    const dto: UpdateNotificationPreferencesDto = {
      [preference]: checked
    };

    // Queue save with debounce
    this.saveSubject$.next(dto);
  }

  private savePreferences(dto: UpdateNotificationPreferencesDto): void {
    this.saving = true;

    this.userProfileService.updateNotificationPreferences(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedPreferences) => {
          this.saving = false;
          this.lastSavedTime = new Date();
          this.preferences = { ...updatedPreferences };
          this.snackBar.open('Értesítési beállítások frissítve!', 'Bezár', {
            duration: 2000,
            horizontalPosition: 'center'
          });
        },
        error: (error) => {
          this.saving = false;
          // Revert optimistic update on error
          if (this.profile?.notification_preferences) {
            this.preferences = { ...this.profile.notification_preferences };
          }
          this.snackBar.open(
            error.message || 'Nem sikerült frissíteni a beállításokat. Kérlek próbáld újra.',
            'Bezár',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
  }
}
