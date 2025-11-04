import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '@shared/material/material.module';
import { ApiService, HealthResponse } from '@core/services/api.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MaterialModule, LoadingSpinnerComponent, CommonModule],
  template: `
    <div class="home-container">
      <section class="hero">
        <h1>Közlekedési Jegykezelő és Utazástervező</h1>
        <p>Vásárolj jegyeket, tervezz utazásokat és értékeld a járatokat.</p>

        <!-- Backend Health Check -->
        <mat-card class="health-card">
          <mat-card-header>
            <mat-card-title>Backend Státusz</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (loading) {
              <app-loading-spinner [diameter]="40" [height]="100" message="Backend ellenőrzése..."/>
            } @else if (health) {
              <div class="health-status">
                <p><strong>Státusz:</strong> <span class="status-ok">{{ health.status }}</span></p>
                <p><strong>Verzió:</strong> {{ health.version }}</p>
                <p><strong>Adatbázis:</strong> {{ health.services.database }}</p>
                <p><strong>Storage:</strong> {{ health.services.storage }}</p>
              </div>
            } @else {
              <p class="error">Backend nem elérhető</p>
            }
          </mat-card-content>
        </mat-card>
      </section>

      <section class="features">
        <h2>Funkciók (Sprint 1+)</h2>
        <div class="feature-grid">
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>directions_bus</mat-icon>
              <mat-card-title>Utazástervező</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Tervezz multimodális utazásokat busz, villamos és metró kombinációkkal.</p>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>confirmation_number</mat-icon>
              <mat-card-title>Jegyvásárlás</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Vásárolj jegyeket és bérleteket egyszerűen és gyorsan.</p>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>map</mat-icon>
              <mat-card-title>Térkép</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Nézd meg a megállókat és járatokat interaktív térképen.</p>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>star</mat-icon>
              <mat-card-title>Értékelések</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Értékeld a járatokat és olvasd el mások véleményét.</p>
            </mat-card-content>
          </mat-card>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 20px;
    }

    .hero {
      text-align: center;
      margin-bottom: 40px;

      h1 {
        font-size: 2.5rem;
        margin-bottom: 16px;
        color: #1976d2;
      }

      p {
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 32px;
      }
    }

    .health-card {
      max-width: 500px;
      margin: 0 auto 40px;
    }

    .health-status {
      p {
        margin: 8px 0;
      }

      .status-ok {
        color: #4caf50;
        font-weight: 500;
      }
    }

    .error {
      color: #f44336;
    }

    .features {
      h2 {
        text-align: center;
        margin-bottom: 24px;
        font-size: 2rem;
      }
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;

      mat-card {
        mat-icon[mat-card-avatar] {
          font-size: 40px;
          width: 40px;
          height: 40px;
        }
      }
    }
  `],
})
export class HomeComponent implements OnInit {
  health: HealthResponse | null = null;
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.checkBackendHealth();
  }

  checkBackendHealth() {
    this.apiService.checkHealth().subscribe({
      next: health => {
        this.health = health;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
