import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketTypeSelectorComponent } from './ticket-type-selector.component';
import { MaterialModule } from '@shared/material/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mockTicketTypes, createMockTicketType } from '../../testing/mock-data';
import { TicketType } from '@core/services/tickets.service';

describe('TicketTypeSelectorComponent', () => {
  let component: TicketTypeSelectorComponent;
  let fixture: ComponentFixture<TicketTypeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketTypeSelectorComponent, MaterialModule, CommonModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketTypeSelectorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Properties', () => {
    it('should accept ticketTypes input', () => {
      component.ticketTypes = mockTicketTypes;
      fixture.detectChanges();

      expect(component.ticketTypes).toEqual(mockTicketTypes);
      expect(component.ticketTypes.length).toBe(5);
    });

    it('should accept selectedType input', () => {
      const selectedType = mockTicketTypes[0];
      component.selectedType = selectedType;
      fixture.detectChanges();

      expect(component.selectedType).toEqual(selectedType);
    });

    it('should default ticketTypes to empty array', () => {
      expect(component.ticketTypes).toEqual([]);
    });

    it('should default selectedType to null', () => {
      expect(component.selectedType).toBeNull();
    });
  });

  describe('Output Events', () => {
    it('should emit selectionChange event when onSelectionChange is called', () => {
      const ticketType = mockTicketTypes[0];
      spyOn(component.selectionChange, 'emit');

      component.onSelectionChange(ticketType);

      expect(component.selectionChange.emit).toHaveBeenCalledWith(ticketType);
    });

    it('should update selectedType when onSelectionChange is called', () => {
      const ticketType = mockTicketTypes[1];
      component.onSelectionChange(ticketType);

      expect(component.selectedType).toEqual(ticketType);
    });

    it('should emit different ticket types correctly', () => {
      spyOn(component.selectionChange, 'emit');

      mockTicketTypes.forEach((ticketType) => {
        component.onSelectionChange(ticketType);
        expect(component.selectionChange.emit).toHaveBeenCalledWith(ticketType);
      });

      expect(component.selectionChange.emit).toHaveBeenCalledTimes(mockTicketTypes.length);
    });
  });

  describe('formatPrice', () => {
    it('should format price with Ft suffix', () => {
      expect(component.formatPrice(350)).toBe('350 Ft');
    });

    it('should format price with no decimals', () => {
      expect(component.formatPrice(1650.99)).toBe('1651 Ft');
    });

    it('should handle zero price', () => {
      expect(component.formatPrice(0)).toBe('0 Ft');
    });

    it('should handle large numbers', () => {
      expect(component.formatPrice(99000)).toBe('99000 Ft');
    });

    it('should handle decimal values correctly', () => {
      expect(component.formatPrice(350.5)).toBe('350 Ft');
      expect(component.formatPrice(350.9)).toBe('351 Ft');
    });
  });

  describe('formatValidity', () => {
    it('should return "Unlimited" for null hours', () => {
      expect(component.formatValidity(null)).toBe('Unlimited');
    });

    it('should format hours correctly', () => {
      expect(component.formatValidity(1)).toBe('1 hours');
      expect(component.formatValidity(2)).toBe('2 hours');
      expect(component.formatValidity(12)).toBe('12 hours');
    });

    it('should format days correctly', () => {
      expect(component.formatValidity(24)).toBe('1 days');
      expect(component.formatValidity(48)).toBe('2 days');
      expect(component.formatValidity(168)).toBe('7 days');
    });

    it('should format months correctly', () => {
      expect(component.formatValidity(720)).toBe('1 months'); // 30 days
      expect(component.formatValidity(1440)).toBe('2 months'); // 60 days
    });

    it('should format years correctly', () => {
      expect(component.formatValidity(8760)).toBe('1 years'); // 365 days
      expect(component.formatValidity(17520)).toBe('2 years'); // 730 days
    });

    it('should handle boundary values', () => {
      expect(component.formatValidity(23)).toBe('23 hours');
      expect(component.formatValidity(719)).toBe('30 days');
      expect(component.formatValidity(8759)).toBe('12 months');
    });
  });

  describe('getTypeIcon', () => {
    it('should return confirmation_number for single type', () => {
      expect(component.getTypeIcon('single')).toBe('confirmation_number');
    });

    it('should return swap_horiz for return type', () => {
      expect(component.getTypeIcon('return')).toBe('swap_horiz');
    });

    it('should return today for day type', () => {
      expect(component.getTypeIcon('day')).toBe('today');
    });

    it('should return calendar_month for monthly type', () => {
      expect(component.getTypeIcon('monthly')).toBe('calendar_month');
    });

    it('should return date_range for yearly type', () => {
      expect(component.getTypeIcon('yearly')).toBe('date_range');
    });

    it('should return default icon for unknown type', () => {
      expect(component.getTypeIcon('unknown')).toBe('confirmation_number');
    });
  });

  describe('getTypeColor', () => {
    it('should return #2196f3 for single type', () => {
      expect(component.getTypeColor('single')).toBe('#2196f3');
    });

    it('should return #ff9800 for return type', () => {
      expect(component.getTypeColor('return')).toBe('#ff9800');
    });

    it('should return #4caf50 for day type', () => {
      expect(component.getTypeColor('day')).toBe('#4caf50');
    });

    it('should return #9c27b0 for monthly type', () => {
      expect(component.getTypeColor('monthly')).toBe('#9c27b0');
    });

    it('should return #f44336 for yearly type', () => {
      expect(component.getTypeColor('yearly')).toBe('#f44336');
    });

    it('should return default color for unknown type', () => {
      expect(component.getTypeColor('unknown')).toBe('#2196f3');
    });
  });

  describe('getTypeBadge', () => {
    it('should return SINGLE for single type', () => {
      expect(component.getTypeBadge('single')).toBe('SINGLE');
    });

    it('should return RETURN for return type', () => {
      expect(component.getTypeBadge('return')).toBe('RETURN');
    });

    it('should return DAY PASS for day type', () => {
      expect(component.getTypeBadge('day')).toBe('DAY PASS');
    });

    it('should return MONTHLY for monthly type', () => {
      expect(component.getTypeBadge('monthly')).toBe('MONTHLY');
    });

    it('should return YEARLY for yearly type', () => {
      expect(component.getTypeBadge('yearly')).toBe('YEARLY');
    });

    it('should return uppercase type for unknown type', () => {
      expect(component.getTypeBadge('custom')).toBe('CUSTOM');
    });
  });

  describe('Component Integration', () => {
    it('should handle complete ticket type selection flow', () => {
      component.ticketTypes = mockTicketTypes;
      spyOn(component.selectionChange, 'emit');

      const selectedType = mockTicketTypes[2]; // Day Pass
      component.onSelectionChange(selectedType);

      expect(component.selectedType).toEqual(selectedType);
      expect(component.selectionChange.emit).toHaveBeenCalledWith(selectedType);
      expect(component.formatPrice(selectedType.price)).toBe('1650 Ft');
      expect(component.getTypeIcon(selectedType.type)).toBe('today');
      expect(component.getTypeColor(selectedType.type)).toBe('#4caf50');
    });

    it('should display all ticket types correctly', () => {
      component.ticketTypes = mockTicketTypes;
      fixture.detectChanges();

      expect(component.ticketTypes.length).toBe(5);

      component.ticketTypes.forEach((ticketType) => {
        expect(component.getTypeIcon(ticketType.type)).toBeDefined();
        expect(component.getTypeColor(ticketType.type)).toBeDefined();
        expect(component.getTypeBadge(ticketType.type)).toBeDefined();
        expect(component.formatPrice(ticketType.price)).toContain('Ft');

        if (ticketType.validity_hours) {
          expect(component.formatValidity(ticketType.validity_hours)).toBeDefined();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty ticket types array', () => {
      component.ticketTypes = [];
      fixture.detectChanges();

      expect(component.ticketTypes.length).toBe(0);
    });

    it('should handle ticket type with no validity hours', () => {
      const unlimitedTicket = createMockTicketType({
        validity_hours: null,
        name: 'Unlimited Pass'
      });

      expect(component.formatValidity(unlimitedTicket.validity_hours)).toBe('Unlimited');
    });

    it('should handle changing selection multiple times', () => {
      const type1 = mockTicketTypes[0];
      const type2 = mockTicketTypes[1];
      const type3 = mockTicketTypes[2];

      component.onSelectionChange(type1);
      expect(component.selectedType).toEqual(type1);

      component.onSelectionChange(type2);
      expect(component.selectedType).toEqual(type2);

      component.onSelectionChange(type3);
      expect(component.selectedType).toEqual(type3);
    });

    it('should handle null selection', () => {
      component.selectedType = mockTicketTypes[0];
      component.selectedType = null;

      expect(component.selectedType).toBeNull();
    });

    it('should handle ticket type with zero price', () => {
      const freeTicket = createMockTicketType({ price: 0 });
      expect(component.formatPrice(freeTicket.price)).toBe('0 Ft');
    });

    it('should handle very large validity hours', () => {
      const largeHours = 100000;
      const formatted = component.formatValidity(largeHours);
      expect(formatted).toContain('years');
    });

    it('should handle fractional validity hours', () => {
      expect(component.formatValidity(0.5)).toBe('0 hours');
      expect(component.formatValidity(36)).toBe('2 days');
    });
  });

  describe('Display Logic', () => {
    it('should provide consistent data for each ticket type', () => {
      mockTicketTypes.forEach((ticketType) => {
        expect(component.getTypeIcon(ticketType.type)).toBeTruthy();
        expect(component.getTypeColor(ticketType.type)).toMatch(/^#[0-9a-f]{6}$/i);
        expect(component.getTypeBadge(ticketType.type)).toBeTruthy();
      });
    });

    it('should format all ticket type prices consistently', () => {
      mockTicketTypes.forEach((ticketType) => {
        const formatted = component.formatPrice(ticketType.price);
        expect(formatted).toMatch(/^\d+ Ft$/);
      });
    });
  });
});
