import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material/material.module';
import { ReportsService } from '@core/services/reports.service';
import { Report, UpdateStatusDto, ReportStatus } from '@core/models/report.model';

type StatusFilter = 'all' | 'pending' | 'in_review' | 'resolved' | 'dismissed';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

@Component({
  selector: 'app-reports-moderation',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './reports-moderation.component.html',
  styleUrl: './reports-moderation.component.scss',
})
export class ReportsModerationComponent implements OnInit {
  private reportsService = inject(ReportsService);

  // Signals for reactive state
  allReports = signal<Report[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  statusFilter = signal<StatusFilter>('pending');
  priorityFilter = signal<PriorityFilter>('all');
  expandedReportId = signal<string | null>(null);

  // Computed values
  filteredReports = computed(() => {
    let reports = this.allReports();

    const status = this.statusFilter();
    if (status !== 'all') {
      reports = reports.filter(r => r.status === status);
    }

    const priority = this.priorityFilter();
    if (priority !== 'all') {
      reports = reports.filter(r => r.priority === priority);
    }

    return reports;
  });

  // Stats computations
  pendingCount = computed(() =>
    this.allReports().filter(r => r.status === 'pending').length
  );

  inReviewCount = computed(() =>
    this.allReports().filter(r => r.status === 'in_review').length
  );

  resolvedCount = computed(() =>
    this.allReports().filter(r => r.status === 'resolved').length
  );

  criticalCount = computed(() =>
    this.allReports().filter(r => r.priority === 'critical' || r.priority === 'high').length
  );

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.reportsService.getReportsQueue().subscribe({
      next: (reports) => {
        this.allReports.set(reports);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.message || 'Nem sikerult betolteni a bejelenteseket. Probald ujra.');
        this.isLoading.set(false);
      }
    });
  }

  setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
  }

  setPriorityFilter(priority: PriorityFilter): void {
    this.priorityFilter.set(priority);
  }

  toggleExpand(reportId: string): void {
    if (this.expandedReportId() === reportId) {
      this.expandedReportId.set(null);
    } else {
      this.expandedReportId.set(reportId);
    }
  }

  isExpanded(reportId: string): boolean {
    return this.expandedReportId() === reportId;
  }

  updateReportStatus(id: string, status: string): void {
    const dto: UpdateStatusDto = { status: status as ReportStatus };
    this.reportsService.updateReportStatus(id, dto).subscribe({
      next: () => {
        this.loadReports();
      },
      error: (error) => {
        this.errorMessage.set(error?.message || 'Nem sikerult frissiteni a statuszt. Probald ujra.');
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'pending': 'schedule',
      'in_review': 'hourglass_empty',
      'resolved': 'check_circle',
      'dismissed': 'cancel'
    };
    return icons[status] || 'help';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Fuggoben',
      'in_review': 'Felulvizsgalat alatt',
      'resolved': 'Megoldva',
      'dismissed': 'Elutasitva'
    };
    return labels[status] || status;
  }

  getPriorityIcon(priority: string): string {
    const icons: { [key: string]: string } = {
      'low': 'arrow_downward',
      'medium': 'remove',
      'high': 'arrow_upward',
      'critical': 'priority_high'
    };
    return icons[priority] || 'flag';
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'low': 'Alacsony',
      'medium': 'Kozepes',
      'high': 'Surgos',
      'critical': 'Kritikus'
    };
    return labels[priority] || priority;
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'service_issue': 'warning',
      'safety_concern': 'security',
      'cleanliness': 'cleaning_services',
      'accessibility': 'accessible',
      'other': 'help_outline',
      'safety': 'security',
      'delay': 'schedule',
      'overcrowding': 'groups',
      'route_issue': 'directions_bus',
      'driver_behavior': 'person_alert',
      'facility': 'business'
    };
    return icons[type] || 'report_problem';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'service_issue': 'Szolgaltatas Problema',
      'safety_concern': 'Biztonsagi Aggaly',
      'cleanliness': 'Tisztasagi Problema',
      'accessibility': 'Akadalymentesites',
      'other': 'Egyeb',
      'safety': 'Biztonsag',
      'delay': 'Keses',
      'overcrowding': 'Tulzsufolt',
      'route_issue': 'Utvonal Problema',
      'driver_behavior': 'Sofor Viselkedese',
      'facility': 'Letesitmeny'
    };
    return labels[type] || type;
  }

  getTypeColor(type: string): { bg: string; border: string; text: string } {
    const colors: { [key: string]: { bg: string; border: string; text: string } } = {
      'service_issue': { bg: 'rgba(244, 67, 54, 0.2)', border: 'rgba(244, 67, 54, 0.4)', text: '#E57373' },
      'safety_concern': { bg: 'rgba(244, 67, 54, 0.2)', border: 'rgba(244, 67, 54, 0.4)', text: '#E57373' },
      'safety': { bg: 'rgba(244, 67, 54, 0.2)', border: 'rgba(244, 67, 54, 0.4)', text: '#E57373' },
      'cleanliness': { bg: 'rgba(255, 152, 0, 0.2)', border: 'rgba(255, 152, 0, 0.4)', text: '#FFB74D' },
      'accessibility': { bg: 'rgba(33, 150, 243, 0.2)', border: 'rgba(33, 150, 243, 0.4)', text: '#64B5F6' },
      'delay': { bg: 'rgba(33, 150, 243, 0.2)', border: 'rgba(33, 150, 243, 0.4)', text: '#64B5F6' },
      'overcrowding': { bg: 'rgba(156, 39, 176, 0.2)', border: 'rgba(156, 39, 176, 0.4)', text: '#BA68C8' },
      'route_issue': { bg: 'rgba(76, 175, 80, 0.2)', border: 'rgba(76, 175, 80, 0.4)', text: '#81C784' },
      'driver_behavior': { bg: 'rgba(255, 87, 34, 0.2)', border: 'rgba(255, 87, 34, 0.4)', text: '#FF8A65' },
      'facility': { bg: 'rgba(0, 188, 212, 0.2)', border: 'rgba(0, 188, 212, 0.4)', text: '#4DD0E1' },
      'other': { bg: 'rgba(158, 158, 158, 0.2)', border: 'rgba(158, 158, 158, 0.4)', text: '#BDBDBD' }
    };
    return colors[type] || colors['other'];
  }
}
