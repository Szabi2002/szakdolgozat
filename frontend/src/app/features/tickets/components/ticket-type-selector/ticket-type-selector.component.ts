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
      return 'Korlátlan';
    }

    if (hours < 24) {
      return `${hours} óra`;
    } else if (hours < 720) {
      return `${Math.round(hours / 24)} nap`;
    } else if (hours < 8760) {
      return `${Math.round(hours / 720)} hónap`;
    } else {
      return `${Math.round(hours / 8760)} év`;
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

  getTypeBadge(type: string): string {
    const badgeMap: Record<string, string> = {
      single: 'VONALJEGY',
      return: 'MENETTÉRTÍ',
      day: 'NAPIJEGY',
      monthly: 'HAVI BÉRLET',
      yearly: 'ÉVES BÉRLET'
    };
    return badgeMap[type] || type.toUpperCase();
  }
}
