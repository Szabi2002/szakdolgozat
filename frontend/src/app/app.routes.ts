import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'landing',
    loadComponent: () =>
      import('./features/landing/pages/home/home.component').then(m => m.LandingHomeComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/pages/verify-email/verify-email.component').then(
        m => m.VerifyEmailComponent
      ),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/pages/callback/callback.component').then(m => m.CallbackComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/pages/overview/overview.component').then(m => m.DashboardOverviewComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./features/user/profile.routes').then(m => m.PROFILE_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'favorites',
    loadChildren: () =>
      import('./features/favorites/favorites.routes').then(m => m.FAVORITES_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'ratings',
        loadComponent: () =>
          import('./features/admin/pages/ratings-moderation/ratings-moderation.component').then(
            m => m.RatingsModerationComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/pages/reports-moderation/reports-moderation.component').then(
            m => m.ReportsModerationComponent
          ),
      },
      {
        path: 'routes',
        loadComponent: () =>
          import('./features/admin/routes-management/routes-management.component').then(m => m.RoutesManagementComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/pages/user-management/user-management.component').then(
            m => m.UserManagementComponent
          ),
      },
    ],
  },
  {
    path: 'stops/:id',
    loadComponent: () =>
      import('./features/stops/stop-details/stop-details.component').then(m => m.StopDetailsComponent),
  },
  {
    path: 'routes/:id',
    loadComponent: () =>
      import('./features/routes/pages/route-details/route-details.component').then(m => m.RouteDetailsComponent),
  },
  {
    path: 'planner',
    loadComponent: () =>
      import('./features/planner/pages/trip-planner/trip-planner.component').then(m => m.TripPlannerComponent),
    canActivate: [authGuard],
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'my-tickets',
        pathMatch: 'full',
      },
      {
        path: 'my-tickets',
        loadComponent: () =>
          import('./features/tickets/pages/my-tickets/my-tickets.component').then(m => m.MyTicketsComponent),
      },
      {
        path: 'purchase',
        loadComponent: () =>
          import('./features/tickets/pages/ticket-purchase/ticket-purchase.component').then(m => m.TicketPurchaseComponent),
      },
    ],
  },
  {
    path: 'ratings',
    canActivate: [authGuard],
    children: [
      {
        path: 'my-ratings',
        loadComponent: () =>
          import('./features/ratings/pages/my-ratings/my-ratings.component').then(m => m.MyRatingsComponent),
      },
    ],
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'my-reports',
        pathMatch: 'full',
      },
      {
        path: 'my-reports',
        loadComponent: () =>
          import('./features/reports/pages/my-reports/my-reports.component').then(m => m.MyReportsComponent),
      },
      {
        path: 'submit',
        loadComponent: () =>
          import('./features/reports/pages/submit-report/submit-report.component').then(m => m.SubmitReportComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'landing',
  },
];
