import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '@shared/material/material.module';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MaterialModule, RouterLink],
  template: `
    <mat-toolbar color="primary" class="header">
      <div class="container">
        <a routerLink="/" class="logo">
          <mat-icon>directions_bus</mat-icon>
          <span>Közlekedési Jegykezelő</span>
        </a>

        <nav class="nav-links">
          <a mat-button routerLink="/">Kezdőlap</a>
          <!-- Sprint 3+: További linkek (Utazástervező, Jegyek, stb.) -->
        </nav>

        <div class="actions">
          <!-- Sprint 1-2: Bejelentkezés gomb -->
          <button mat-raised-button color="accent">Bejelentkezés</button>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .header {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: white;
      font-size: 1.2rem;
      font-weight: 500;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    .nav-links {
      display: flex;
      gap: 8px;
    }

    .actions {
      display: flex;
      gap: 8px;
    }
  `],
})
export class HeaderComponent {}
