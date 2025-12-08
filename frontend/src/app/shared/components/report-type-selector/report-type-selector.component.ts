import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportType, REPORT_TYPE_METADATA, ReportTypeMetadata } from '@core/models/report.model';

/**
 * Report type selector component
 * Displays clickable cards for each report type with icon, label, and description
 */
@Component({
  selector: 'app-report-type-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './report-type-selector.component.html',
  styleUrls: ['./report-type-selector.component.scss']
})
export class ReportTypeSelectorComponent {
  @Input() selected?: ReportType;
  @Output() selectionChange = new EventEmitter<ReportType>();

  reportTypes: ReportTypeMetadata[] = Object.values(REPORT_TYPE_METADATA);

  constructor() {
    console.log('[ReportTypeSelectorComponent] Constructor called');
    console.log('[ReportTypeSelectorComponent] Report types count:', this.reportTypes.length);
    console.log('[ReportTypeSelectorComponent] Report types:', this.reportTypes);
  }

  /**
   * Handle report type selection
   * @param type Selected report type
   */
  selectType(type: ReportType): void {
    this.selected = type;
    this.selectionChange.emit(type);
  }

  /**
   * Check if a type is currently selected
   * @param type Report type to check
   * @returns True if selected
   */
  isSelected(type: ReportType): boolean {
    return this.selected === type;
  }
}
