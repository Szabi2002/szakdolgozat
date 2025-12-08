import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';
import { Observable } from 'rxjs';
import { User } from '@core/models/user.model';

// Import widget components
import { QuickTripPlannerComponent } from '@features/dashboard/components/quick-trip-planner/quick-trip-planner.component';
import { ActiveTicketsComponent } from '@features/dashboard/components/active-tickets/active-tickets.component';
import { FavoriteRoutesComponent } from '@features/dashboard/components/favorite-routes/favorite-routes.component';
import { UserStatisticsComponent } from '@features/dashboard/components/user-statistics/user-statistics.component';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    QuickTripPlannerComponent,
    ActiveTicketsComponent,
    FavoriteRoutesComponent,
    UserStatisticsComponent,
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class DashboardOverviewComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$: Observable<User | null> = this.authService.currentUser$;

  /**
   * Get greeting based on time of day
   */
  getCurrentGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Jó reggelt! Tervezd meg mai utazásod.';
    } else if (hour < 18) {
      return 'Szép napot! Hova tartasz ma?';
    } else {
      return 'Jó estét! Tervezd meg holnapi utazásod.';
    }
  }

  /**
   * Navigate to tickets page
   */
  navigateToTickets(): void {
    this.router.navigate(['/tickets']);
  }

  /**
   * Navigate to routes page
   */
  navigateToRoutes(): void {
    this.router.navigate(['/routes']);
  }
}
