import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const FAVORITES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/favorites-list/favorites-list.component').then(m => m.FavoritesListComponent),
    canActivate: [authGuard]
  }
];
