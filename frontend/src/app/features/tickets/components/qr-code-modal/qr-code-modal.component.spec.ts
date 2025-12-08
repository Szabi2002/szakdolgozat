import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QrCodeModalComponent } from './qr-code-modal.component';
import { TicketsService } from '@core/services/tickets.service';
import { of, throwError } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

describe('QrCodeModalComponent', () => {
  let component: QrCodeModalComponent;
  let fixture: ComponentFixture<QrCodeModalComponent>;
  let mockTicketsService: jasmine.SpyObj<TicketsService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<QrCodeModalComponent>>;
  let mockSanitizer: jasmine.SpyObj<DomSanitizer>;

  const mockTicket = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: 'user-1',
    ticket_type_id: 'type-1',
    ticket_type: {
      id: 'type-1',
      name: 'Single Ticket',
      description: 'Valid for one trip',
      type: 'single' as const,
      price: 350,
      validity_hours: 1,
      is_active: true
    },
    qr_code: 'base64-qr-code',
    purchase_date: '2025-01-15T10:00:00Z',
    valid_from: '2025-01-15T10:00:00Z',
    valid_until: '2025-01-15T11:00:00Z',
    status: 'active' as const,
    price: 350,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  };

  beforeEach(async () => {
    mockTicketsService = jasmine.createSpyObj('TicketsService', [
      'getTicketQRCode',
      'isTicketValid',
      'getTicketStatusColor'
    ]);

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSanitizer = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustUrl']);

    await TestBed.configureTestingModule({
      imports: [QrCodeModalComponent],
      providers: [
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockTicket },
        { provide: DomSanitizer, useValue: mockSanitizer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QrCodeModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load QR code on init', () => {
    const mockBlob = new Blob(['qr-code'], { type: 'image/png' });
    mockTicketsService.getTicketQRCode.and.returnValue(of(mockBlob));
    mockSanitizer.bypassSecurityTrustUrl.and.returnValue('safe-url');

    component.ngOnInit();

    expect(mockTicketsService.getTicketQRCode).toHaveBeenCalledWith(mockTicket.id);
    expect(component.isLoading).toBe(false);
    expect(component.qrCodeUrl).toBe('safe-url');
  });

  it('should handle QR code load error', () => {
    mockTicketsService.getTicketQRCode.and.returnValue(
      throwError(() => new Error('Failed to load'))
    );

    component.ngOnInit();

    expect(component.isLoading).toBe(false);
    expect(component.error).toBeTruthy();
  });

  it('should download QR code', () => {
    const mockLink = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(mockLink);
    spyOn(mockLink, 'click');

    component.qrCodeUrl = 'blob:test-url';
    component.downloadQRCode();

    expect(mockLink.href).toBe('blob:test-url');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should close dialog', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should check if ticket is valid', () => {
    mockTicketsService.isTicketValid.and.returnValue(true);
    expect(component.isTicketValid).toBe(true);
    expect(mockTicketsService.isTicketValid).toHaveBeenCalledWith(mockTicket);
  });
});
