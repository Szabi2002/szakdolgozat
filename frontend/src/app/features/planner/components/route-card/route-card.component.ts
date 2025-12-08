import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '@shared/material/material.module';
import { Route, RouteStep, PlannerService } from '@core/services/planner.service';
import { FavoritesService } from '@core/services/favorites.service';
import { SaveFavoriteDialogComponent } from '../../../favorites/components/save-favorite-dialog/save-favorite-dialog.component';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-route-card',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './route-card.component.html',
  styleUrl: './route-card.component.scss'
})
export class RouteCardComponent implements OnInit {
  @Input() route!: Route;
  @Input() selected = false;
  @Input() fromStop: any;
  @Input() toStop: any;

  isExpanded = false;
  canSaveFavorite = true;
  savingFavorite = false;

  private destroy$ = new Subject<void>();

  constructor(
    private plannerService: PlannerService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    this.checkFavoritesLimit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkFavoritesLimit(): void {
    this.favoritesService.hasReachedLimit()
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasReached => {
        this.canSaveFavorite = !hasReached;
      });
  }

  get badgeInfo() {
    if (this.route.recommended) {
      return {
        icon: '🏆',
        label: 'Ajánlott',
        class: 'recommended'
      };
    }
    if (this.route.transfers === 0) {
      return {
        icon: '🎯',
        label: 'Közvetlen',
        class: 'direct'
      };
    }
    if (this.route.walking_distance < 200) {
      return {
        icon: '🚶',
        label: 'Kevés gyaloglás',
        class: 'low-walking'
      };
    }
    return null;
  }

  getStepIcon(step: RouteStep): string {
    return this.plannerService.getStepIcon(step);
  }

  getStepTypeText(step: RouteStep): string {
    return this.plannerService.getStepTypeText(step);
  }

  formatDuration(minutes: number): string {
    return this.plannerService.formatDuration(minutes);
  }

  formatWalkingDistance(meters: number): string {
    return this.plannerService.formatWalkingDistance(meters);
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  onBuyTicket(): void {
    this.router.navigate(['/tickets/purchase'], {
      state: {
        route: this.route,
        fromStop: this.fromStop,
        toStop: this.toStop
      }
    });
  }

  onSaveAsFavorite(): void {
    if (!this.fromStop || !this.toStop) {
      this.snackBar.open('Nem sikerült menteni a kedvencet: hiányzó megálló információ', 'Bezár', {
        duration: 3000
      });
      return;
    }

    if (!this.canSaveFavorite) {
      this.snackBar.open('Elérted a maximum 20 kedvenc limitet', 'Bezár', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const dialogRef = this.dialog.open(SaveFavoriteDialogComponent, {
      width: '500px',
      data: {
        mode: 'create',
        fromStopId: this.fromStop.id,
        fromStopName: this.fromStop.name,
        toStopId: this.toStop.id,
        toStopName: this.toStop.name,
        routeData: {
          total_time: this.route.total_time,
          transfers: this.route.transfers,
          walking_distance: this.route.walking_distance,
          steps: this.route.steps
        }
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Útvonal sikeresen mentve a kedvencek közé!', 'Megtekintés', {
            duration: 4000
          }).onAction().subscribe(() => {
            this.router.navigate(['/favorites']);
          });
          this.checkFavoritesLimit();
        }
      });
  }

  viewRouteDetails(): void {
    // Extract route ID from the first transit step
    const transitStep = this.route.steps.find(step => step.type === 'transit');

    if (transitStep && transitStep.route_id) {
      this.router.navigate(['/routes', transitStep.route_id]);
    } else {
      this.snackBar.open('A járat részletei nem érhetők el ehhez az útvonalhoz', 'Bezár', {
        duration: 3000
      });
    }
  }
}
