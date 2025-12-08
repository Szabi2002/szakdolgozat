import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterModule } from '@angular/router';
import localeHu from '@angular/common/locales/hu';
import { MaterialModule } from '@shared/material/material.module';
import { AdminService } from '@core/services/admin.service';
import { AdminStats } from '@core/models/admin/admin.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { environment } from '@environments/environment';

// Register locale data for Hungarian
registerLocaleData(localeHu);

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  providers: [{ provide: LOCALE_ID, useValue: 'hu' }],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private adminService = inject(AdminService);

  @ViewChild('monthlyChart', { static: false }) monthlyChartRef!: ElementRef<HTMLCanvasElement>;

  stats: AdminStats | null = null;
  isLoading = true;
  errorMessage = '';
  lastRefreshed: Date | null = null;
  today = new Date();
  private autoRefreshInterval: any;
  private readonly AUTO_REFRESH_INTERVAL_MS = 30000; // 30 seconds
  private chart: Chart | null = null;

  ngOnInit(): void {
    this.loadStats();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.destroyChart();
  }

  ngAfterViewInit(): void {
    // Chart will be created after stats are loaded
  }

  /**
   * Load dashboard statistics from the backend
   */
  loadStats(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.getStats().subscribe({
      next: (data) => {
        // Ensure ratingsStatusDistribution has default values if undefined
        this.stats = {
          ...data,
          ratingsStatusDistribution: data.ratingsStatusDistribution || {
            approved: 0,
            pending: 0,
            rejected: 0
          }
        };
        this.lastRefreshed = new Date();
        this.isLoading = false;

        // Create chart after stats are loaded and view is initialized
        setTimeout(() => this.createMonthlyRegistrationsChart(), 100);

        if (!environment.production) {
          console.log('[Dashboard] Stats loaded:', this.stats);
        }
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.message || 'Nem sikerult betolteni a statisztikakat. Probald ujra.';
        this.isLoading = false;

        if (!environment.production) {
          console.error('[Dashboard] Failed to load stats:', error);
        }
      }
    });
  }

  /**
   * Start automatic refresh of statistics
   */
  private startAutoRefresh(): void {
    this.autoRefreshInterval = setInterval(() => {
      if (!this.isLoading) {
        this.refreshStats();
      }
    }, this.AUTO_REFRESH_INTERVAL_MS);
  }

  /**
   * Stop automatic refresh
   */
  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  /**
   * Refresh statistics without showing loading spinner
   * Used for background auto-refresh
   */
  private refreshStats(): void {
    this.errorMessage = '';

    this.adminService.getStats().subscribe({
      next: (data) => {
        this.stats = {
          ...data,
          ratingsStatusDistribution: data.ratingsStatusDistribution || {
            approved: 0,
            pending: 0,
            rejected: 0
          }
        };
        this.lastRefreshed = new Date();

        // Update chart with new data
        this.updateMonthlyRegistrationsChart();

        if (!environment.production) {
          console.log('[Dashboard] Stats refreshed (auto):', this.stats);
        }
      },
      error: (error: any) => {
        // Silently fail on auto-refresh, don't show error to user
        if (!environment.production) {
          console.error('[Dashboard] Auto-refresh failed:', error);
        }
      }
    });
  }

  /**
   * Format last refreshed time for display
   */
  getLastRefreshedTime(): string {
    if (!this.lastRefreshed) return '';

    const now = new Date();
    const diff = Math.floor((now.getTime() - this.lastRefreshed.getTime()) / 1000); // seconds

    if (diff < 60) return `${diff} masodperce`;
    if (diff < 3600) return `${Math.floor(diff / 60)} perce`;

    return this.lastRefreshed.toLocaleTimeString('hu-HU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Create monthly registrations chart using Chart.js with dark theme styling
   */
  private createMonthlyRegistrationsChart(): void {
    if (!this.stats?.monthlyRegistrations || !this.monthlyChartRef) {
      return;
    }

    // Destroy existing chart if any
    this.destroyChart();

    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Prepare data from stats
    const labels = this.stats.monthlyRegistrations.map(mr => this.formatMonthLabel(mr.month));
    const data = this.stats.monthlyRegistrations.map(mr => mr.count);

    // Dark theme colors
    const primaryColor = 'rgba(91, 100, 249, 1)'; // persian-blue-500
    const primaryColorLight = 'rgba(91, 100, 249, 0.6)';
    const primaryColorLighter = 'rgba(91, 100, 249, 0.2)';
    const textColor = 'rgba(196, 210, 255, 1)'; // persian-blue-200
    const mutedColor = 'rgba(160, 181, 255, 0.5)'; // persian-blue-300
    const gridColor = 'rgba(255, 255, 255, 0.06)';

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, primaryColorLight);
    gradient.addColorStop(1, primaryColorLighter);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Uj regisztraciok',
          data: data,
          backgroundColor: gradient,
          borderColor: primaryColor,
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: primaryColor,
          hoverBorderColor: 'rgba(122, 139, 255, 1)', // persian-blue-400
          hoverBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: textColor,
              font: {
                size: 12,
                family: "'Plus Jakarta Sans', 'Roboto', sans-serif",
                weight: 500
              },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(41, 41, 134, 0.95)', // persian-blue-900
            titleColor: 'rgba(237, 242, 255, 1)', // persian-blue-50
            bodyColor: 'rgba(196, 210, 255, 1)', // persian-blue-200
            borderColor: 'rgba(91, 100, 249, 0.5)',
            borderWidth: 1,
            padding: 16,
            cornerRadius: 12,
            displayColors: true,
            boxPadding: 6,
            titleFont: {
              size: 14,
              weight: 600
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: (context) => {
                return ` ${context.dataset.label}: ${context.parsed.y} felhasznalo`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: mutedColor,
              font: {
                size: 11,
                family: "'Plus Jakarta Sans', 'Roboto', sans-serif"
              },
              padding: 8
            },
            grid: {
              color: gridColor,
              lineWidth: 1
            },
            border: {
              display: false
            },
            title: {
              display: true,
              text: 'Felhasznalok szama',
              color: textColor,
              font: {
                size: 12,
                weight: 500,
                family: "'Plus Jakarta Sans', 'Roboto', sans-serif"
              },
              padding: { bottom: 8 }
            }
          },
          x: {
            ticks: {
              color: mutedColor,
              font: {
                size: 11,
                family: "'Plus Jakarta Sans', 'Roboto', sans-serif"
              },
              padding: 8
            },
            grid: {
              display: false
            },
            border: {
              display: false
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      }
    };

    this.chart = new Chart(ctx, config);

    if (!environment.production) {
      console.log('[Dashboard] Chart created with data:', { labels, data });
    }
  }

  /**
   * Update existing chart with new data
   */
  private updateMonthlyRegistrationsChart(): void {
    if (!this.chart || !this.stats?.monthlyRegistrations) {
      // If chart doesn't exist yet, create it
      this.createMonthlyRegistrationsChart();
      return;
    }

    const labels = this.stats.monthlyRegistrations.map(mr => this.formatMonthLabel(mr.month));
    const data = this.stats.monthlyRegistrations.map(mr => mr.count);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update('none'); // Update without animation for smoother refresh

    if (!environment.production) {
      console.log('[Dashboard] Chart updated with new data');
    }
  }

  /**
   * Destroy the chart instance
   */
  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Format month label from YYYY-MM format to readable Hungarian format
   */
  private formatMonthLabel(monthString: string): string {
    const [year, month] = monthString.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
      'Jul', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }
}
