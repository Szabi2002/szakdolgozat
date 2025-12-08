import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { QrCodeDisplayComponent } from './qr-code-display.component';
import { TicketsService } from '@core/services/tickets.service';
import { DomSanitizer } from '@angular/platform-browser';
import { MaterialModule } from '@shared/material/material.module';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { mockTickets, createMockTicket } from '../../testing/mock-data';

describe('QrCodeDisplayComponent', () => {
  let component: QrCodeDisplayComponent;
  let fixture: ComponentFixture<QrCodeDisplayComponent>;
  let mockTicketsService: jasmine.SpyObj<TicketsService>;
  let mockSanitizer: jasmine.SpyObj<DomSanitizer>;

  beforeEach(async () => {
    mockTicketsService = jasmine.createSpyObj('TicketsService', [
      'getTicketQRCode',
      'isTicketValid'
    ]);

    mockSanitizer = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustUrl']);

    await TestBed.configureTestingModule({
      imports: [QrCodeDisplayComponent, MaterialModule, CommonModule],
      providers: [
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: DomSanitizer, useValue: mockSanitizer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QrCodeDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.qrCodeUrl).toBeNull();
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
    });

    it('should have ticketsService injected', () => {
      expect(component.ticketsService).toBe(mockTicketsService);
    });
  });

  describe('ngOnInit', () => {
    it('should call loadQRCode on initialization', () => {
      spyOn(component, 'loadQRCode');
      component.ticket = mockTickets[0];

      component.ngOnInit();

      expect(component.loadQRCode).toHaveBeenCalled();
    });
  });

  describe('loadQRCode', () => {
    it('should load QR code successfully', fakeAsync(() => {
      const mockBlob = new Blob(['fake-qr-code'], { type: 'image/png' });
      const mockUrl = 'blob:http://localhost/fake-url';
      const mockSafeUrl = { changingThisBreaksApplicationSecurity: mockUrl };

      mockTicketsService.getTicketQRCode.and.returnValue(of(mockBlob));
      mockSanitizer.bypassSecurityTrustUrl.and.returnValue(mockSafeUrl as any);

      spyOn(URL, 'createObjectURL').and.returnValue(mockUrl);

      component.ticket = mockTickets[0];
      component.loadQRCode();

      expect(component.isLoading).toBe(true);
      expect(component.error).toBeNull();

      tick();

      expect(mockTicketsService.getTicketQRCode).toHaveBeenCalledWith(mockTickets[0].id);
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith(mockUrl);
      expect(component.qrCodeUrl).toEqual(mockSafeUrl);
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
    }));

    it('should handle error when loading QR code fails', fakeAsync(() => {
      const errorResponse = { status: 500, message: 'Server error' };
      mockTicketsService.getTicketQRCode.and.returnValue(
        throwError(() => errorResponse)
      );

      component.ticket = mockTickets[0];
      component.loadQRCode();

      expect(component.isLoading).toBe(true);

      tick();

      expect(mockTicketsService.getTicketQRCode).toHaveBeenCalledWith(mockTickets[0].id);
      expect(component.error).toBe('Failed to load QR code');
      expect(component.isLoading).toBe(false);
      expect(component.qrCodeUrl).toBeNull();
    }));

    it('should set error when ticket is not provided', () => {
      component.ticket = null as any;
      component.loadQRCode();

      expect(component.error).toBe('Invalid ticket');
      expect(mockTicketsService.getTicketQRCode).not.toHaveBeenCalled();
    });

    it('should set error when ticket has no id', () => {
      component.ticket = { ...mockTickets[0], id: '' };
      component.loadQRCode();

      expect(component.error).toBe('Invalid ticket');
      expect(mockTicketsService.getTicketQRCode).not.toHaveBeenCalled();
    });

    it('should reset error and loading state correctly', fakeAsync(() => {
      const mockBlob = new Blob(['fake-qr-code'], { type: 'image/png' });
      mockTicketsService.getTicketQRCode.and.returnValue(of(mockBlob));
      mockSanitizer.bypassSecurityTrustUrl.and.returnValue('safe-url' as any);
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');

      component.error = 'Previous error';
      component.ticket = mockTickets[0];
      component.loadQRCode();

      expect(component.error).toBeNull();
      expect(component.isLoading).toBe(true);

      tick();

      expect(component.isLoading).toBe(false);
    }));
  });

  describe('downloadQRCode', () => {
    it('should trigger download when qrCodeUrl is available', () => {
      const mockUrl = 'blob:http://localhost/fake-url';
      const mockSafeUrl = {
        toString: () => mockUrl,
        changingThisBreaksApplicationSecurity: mockUrl
      };
      component.qrCodeUrl = mockSafeUrl as any;
      component.ticket = mockTickets[0];

      const mockLink = {
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      };
      spyOn(document, 'createElement').and.returnValue(mockLink as any);

      component.downloadQRCode();

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe(mockUrl);
      expect(mockLink.download).toContain('ticket-');
      expect(mockLink.download).toContain('-qr.png');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should not trigger download when qrCodeUrl is null', () => {
      component.qrCodeUrl = null;
      spyOn(document, 'createElement');

      component.downloadQRCode();

      expect(document.createElement).not.toHaveBeenCalled();
    });

    it('should generate correct filename with ticket id', () => {
      const mockUrl = 'blob:http://localhost/fake-url';
      const mockSafeUrl = {
        toString: () => mockUrl,
        changingThisBreaksApplicationSecurity: mockUrl
      };
      component.qrCodeUrl = mockSafeUrl as any;
      component.ticket = createMockTicket({ id: 'abc123-def456-789' });

      const mockLink = {
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      };
      spyOn(document, 'createElement').and.returnValue(mockLink as any);

      component.downloadQRCode();

      expect(mockLink.download).toBe('ticket-abc123-d-qr.png');
    });
  });

  describe('isTicketValid getter', () => {
    it('should return true for valid ticket', () => {
      component.ticket = mockTickets[0];
      mockTicketsService.isTicketValid.and.returnValue(true);

      expect(component.isTicketValid).toBe(true);
      expect(mockTicketsService.isTicketValid).toHaveBeenCalledWith(mockTickets[0]);
    });

    it('should return false for invalid ticket', () => {
      component.ticket = mockTickets[1];
      mockTicketsService.isTicketValid.and.returnValue(false);

      expect(component.isTicketValid).toBe(false);
      expect(mockTicketsService.isTicketValid).toHaveBeenCalledWith(mockTickets[1]);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should revoke object URL when destroying component', () => {
      const mockUrl = 'blob:http://localhost/fake-url';
      const mockSafeUrl = {
        toString: () => mockUrl,
        changingThisBreaksApplicationSecurity: mockUrl
      };
      component.qrCodeUrl = mockSafeUrl as any;

      spyOn(URL, 'revokeObjectURL');

      component.ngOnDestroy();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    it('should not revoke URL if qrCodeUrl is null', () => {
      component.qrCodeUrl = null;
      spyOn(URL, 'revokeObjectURL');

      component.ngOnDestroy();

      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('should not revoke URL if not a blob URL', () => {
      const mockUrl = 'http://example.com/image.png';
      const mockSafeUrl = {
        toString: () => mockUrl,
        changingThisBreaksApplicationSecurity: mockUrl
      };
      component.qrCodeUrl = mockSafeUrl as any;

      spyOn(URL, 'revokeObjectURL');

      component.ngOnDestroy();

      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching QR code', () => {
      mockTicketsService.getTicketQRCode.and.returnValue(of(new Blob()));
      mockSanitizer.bypassSecurityTrustUrl.and.returnValue('url' as any);
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');

      component.ticket = mockTickets[0];
      component.loadQRCode();

      expect(component.isLoading).toBe(true);
    });

    it('should clear loading state after successful load', fakeAsync(() => {
      const mockBlob = new Blob(['fake-qr-code'], { type: 'image/png' });
      mockTicketsService.getTicketQRCode.and.returnValue(of(mockBlob));
      mockSanitizer.bypassSecurityTrustUrl.and.returnValue('url' as any);
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');

      component.ticket = mockTickets[0];
      component.loadQRCode();

      tick();

      expect(component.isLoading).toBe(false);
    }));

    it('should clear loading state after error', fakeAsync(() => {
      mockTicketsService.getTicketQRCode.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.ticket = mockTickets[0];
      component.loadQRCode();

      tick();

      expect(component.isLoading).toBe(false);
    }));
  });

  describe('Error Handling', () => {
    it('should display error message on failed load', fakeAsync(() => {
      mockTicketsService.getTicketQRCode.and.returnValue(
        throwError(() => ({ status: 404 }))
      );

      component.ticket = mockTickets[0];
      component.loadQRCode();

      tick();

      expect(component.error).toBe('Failed to load QR code');
    }));

    it('should handle network errors', fakeAsync(() => {
      mockTicketsService.getTicketQRCode.and.returnValue(
        throwError(() => ({ status: 0, message: 'Network error' }))
      );

      component.ticket = mockTickets[0];
      component.loadQRCode();

      tick();

      expect(component.error).toBe('Failed to load QR code');
    }));

    it('should clear previous errors on new load attempt', () => {
      component.error = 'Previous error';
      mockTicketsService.getTicketQRCode.and.returnValue(of(new Blob()));
      mockSanitizer.bypassSecurityTrustUrl.and.returnValue('url' as any);
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');

      component.ticket = mockTickets[0];
      component.loadQRCode();

      expect(component.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined ticket', () => {
      component.ticket = undefined as any;
      component.loadQRCode();

      expect(component.error).toBe('Invalid ticket');
    });

    it('should handle multiple consecutive load attempts', fakeAsync(() => {
      const mockBlob = new Blob(['fake-qr-code'], { type: 'image/png' });
      mockTicketsService.getTicketQRCode.and.returnValue(of(mockBlob));
      mockSanitizer.bypassSecurityTrustUrl.and.returnValue('url' as any);
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');

      component.ticket = mockTickets[0];

      component.loadQRCode();
      tick();

      component.loadQRCode();
      tick();

      component.loadQRCode();
      tick();

      expect(mockTicketsService.getTicketQRCode).toHaveBeenCalledTimes(3);
    }));

    it('should handle very long ticket ids', () => {
      const longId = 'a'.repeat(200);
      const mockUrl = 'blob:url';
      const mockSafeUrl = { toString: () => mockUrl };
      component.qrCodeUrl = mockSafeUrl as any;
      component.ticket = createMockTicket({ id: longId });

      const mockLink = {
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      };
      spyOn(document, 'createElement').and.returnValue(mockLink as any);

      component.downloadQRCode();

      expect(mockLink.download).toContain('-qr.png');
    });
  });
});
