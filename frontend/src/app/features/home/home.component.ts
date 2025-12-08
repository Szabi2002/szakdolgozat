import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '@shared/material/material.module';
import { ApiService, HealthResponse } from '@core/services/api.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MaterialModule, LoadingSpinnerComponent, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
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
