import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '@shared/material/material.module';
import { TicketType } from '@core/services/tickets.service';

@Component({
  selector: 'app-ticket-type-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './ticket-type-selector.component.html',
  styleUrls: ['./ticket-type-selector.component.scss']
})
export class TicketTypeSelectorComponent {
  @Input() ticketTypes: TicketType[] = [];
  @Input() selectedType: TicketType | null = null;
  @Output() selectionChange = new EventEmitter<TicketType>();

  onSelectionChange(ticketType: TicketType): void {
    this.selectedType = ticketType;
    this.selectionChange.emit(ticketType);
  }

  formatPrice(price: number): string {
    return `${price.toFixed(0)} Ft`;
  }

  formatValidity(hours: number | null): string {
    if (!hours) {
      return 'Unlimited';
    }

    if (hours < 24) {
      return `${hours} hours`;
    } else if (hours < 720) {
      return `${Math.round(hours / 24)} days`;
    } else if (hours < 8760) {
      return `${Math.round(hours / 720)} months`;
    } else {
      return `${Math.round(hours / 8760)} years`;
    }
  }

  getTypeIcon(type: string): string {
    const iconMap: Record<string, string> = {
      single: 'confirmation_number',
      return: 'swap_horiz',
      day: 'today',
      monthly: 'calendar_month',
      yearly: 'date_range'
    };
    return iconMap[type] || 'confirmation_number';
  }

  getTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      single: '#2196f3',
      return: '#ff9800',
      day: '#4caf50',
      monthly: '#9c27b0',
      yearly: '#f44336'
    };
    return colorMap[type] || '#2196f3';
  }

  getTypeBadge(type: string): string {
    const badgeMap: Record<string, string> = {
      single: 'SINGLE',
      return: 'RETURN',
      day: 'DAY PASS',
      monthly: 'MONTHLY',
      yearly: 'YEARLY'
    };
    return badgeMap[type] || type.toUpperCase();
  }
}
