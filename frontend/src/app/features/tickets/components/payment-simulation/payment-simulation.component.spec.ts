import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PaymentSimulationComponent, PaymentData } from './payment-simulation.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '@shared/material/material.module';
import { CommonModule } from '@angular/common';
import { mockTicketTypes } from '../../testing/mock-data';

describe('PaymentSimulationComponent', () => {
  let component: PaymentSimulationComponent;
  let fixture: ComponentFixture<PaymentSimulationComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<PaymentSimulationComponent>>;
  let mockPaymentData: PaymentData;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockPaymentData = {
      ticketType: mockTicketTypes[0],
      routeId: 'route-1',
      fromStopId: 'stop-1',
      toStopId: 'stop-2'
    };

    await TestBed.configureTestingModule({
      imports: [PaymentSimulationComponent, MaterialModule, CommonModule, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockPaymentData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSimulationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.isProcessing).toBe(false);
      expect(component.currentStep).toBe(1);
      expect(component.totalSteps).toBe(3);
    });

    it('should have payment methods defined', () => {
      expect(component.paymentMethods).toBeDefined();
      expect(component.paymentMethods.length).toBe(4);
    });

    it('should call initializeForm on ngOnInit', () => {
      spyOn(component, 'initializeForm');
      component.ngOnInit();
      expect(component.initializeForm).toHaveBeenCalled();
    });

    it('should receive payment data', () => {
      expect(component.data).toEqual(mockPaymentData);
    });
  });

  describe('Form Initialization', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should initialize payment form with default values', () => {
      expect(component.paymentForm).toBeDefined();
      expect(component.paymentForm.get('paymentMethod')?.value).toBe('card');
      expect(component.paymentForm.get('saveCard')?.value).toBe(false);
    });

    it('should have all required form controls', () => {
      expect(component.paymentForm.get('paymentMethod')).toBeDefined();
      expect(component.paymentForm.get('cardNumber')).toBeDefined();
      expect(component.paymentForm.get('cardHolder')).toBeDefined();
      expect(component.paymentForm.get('expiryDate')).toBeDefined();
      expect(component.paymentForm.get('cvv')).toBeDefined();
      expect(component.paymentForm.get('saveCard')).toBeDefined();
    });

    it('should set validators on card fields', () => {
      const cardNumber = component.paymentForm.get('cardNumber');
      const cardHolder = component.paymentForm.get('cardHolder');
      const expiryDate = component.paymentForm.get('expiryDate');
      const cvv = component.paymentForm.get('cvv');

      expect(cardNumber?.hasError('required')).toBe(true);
      expect(cardHolder?.hasError('required')).toBe(true);
      expect(expiryDate?.hasError('required')).toBe(true);
      expect(cvv?.hasError('required')).toBe(true);
    });
  });

  describe('Price Calculations', () => {
    it('should return correct ticket price', () => {
      expect(component.ticketPrice).toBe(mockTicketTypes[0].price);
    });

    it('should calculate service fee as 2% of ticket price', () => {
      const expectedFee = Math.round(mockTicketTypes[0].price * 0.02);
      expect(component.serviceFee).toBe(expectedFee);
    });

    it('should calculate total price correctly', () => {
      const expectedTotal = mockTicketTypes[0].price + component.serviceFee;
      expect(component.totalPrice).toBe(expectedTotal);
    });

    it('should format price correctly', () => {
      expect(component.formatPrice(350)).toBe('350 Ft');
      expect(component.formatPrice(1650.99)).toBe('1651 Ft');
    });
  });

  describe('Payment Method Changes', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should update validators when changing to card payment', () => {
      component.paymentForm.get('paymentMethod')?.setValue('card');
      component.onPaymentMethodChange();

      const cardNumber = component.paymentForm.get('cardNumber');
      const cardHolder = component.paymentForm.get('cardHolder');

      expect(cardNumber?.hasError('required')).toBe(true);
      expect(cardHolder?.hasError('required')).toBe(true);
    });

    it('should clear validators when changing to non-card payment', () => {
      component.paymentForm.get('paymentMethod')?.setValue('paypal');
      component.onPaymentMethodChange();

      const cardNumber = component.paymentForm.get('cardNumber');
      const cardHolder = component.paymentForm.get('cardHolder');
      const expiryDate = component.paymentForm.get('expiryDate');
      const cvv = component.paymentForm.get('cvv');

      cardNumber?.setValue('');
      cardHolder?.setValue('');
      expiryDate?.setValue('');
      cvv?.setValue('');

      expect(cardNumber?.hasError('required')).toBe(false);
      expect(cardHolder?.hasError('required')).toBe(false);
      expect(expiryDate?.hasError('required')).toBe(false);
      expect(cvv?.hasError('required')).toBe(false);
    });

    it('should handle switching between payment methods', () => {
      component.paymentForm.get('paymentMethod')?.setValue('card');
      component.onPaymentMethodChange();

      component.paymentForm.get('paymentMethod')?.setValue('paypal');
      component.onPaymentMethodChange();

      component.paymentForm.get('paymentMethod')?.setValue('applepay');
      component.onPaymentMethodChange();

      expect(component.paymentForm.get('paymentMethod')?.value).toBe('applepay');
    });
  });

  describe('Card Number Formatting', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should remove spaces from card number', () => {
      const event = {
        target: { value: '1234 5678 9012 3456' }
      };

      component.formatCardNumber(event);

      expect(event.target.value).toBe('1234567890123456');
    });

    it('should limit card number to 16 digits', () => {
      const event = {
        target: { value: '12345678901234567890' }
      };

      component.formatCardNumber(event);

      expect(event.target.value).toBe('1234567890123456');
      expect(event.target.value.length).toBe(16);
    });

    it('should update form control value', () => {
      const event = {
        target: { value: '1234567890123456' }
      };

      component.formatCardNumber(event);

      expect(component.paymentForm.get('cardNumber')?.value).toBe('1234567890123456');
    });
  });

  describe('Expiry Date Formatting', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should format expiry date with slash', () => {
      const event = {
        target: { value: '1225' }
      };

      component.formatExpiryDate(event);

      expect(event.target.value).toBe('12/25');
    });

    it('should remove non-numeric characters', () => {
      const event = {
        target: { value: '12/25' }
      };

      component.formatExpiryDate(event);

      expect(event.target.value).toBe('12/25');
    });

    it('should limit to MM/YY format', () => {
      const event = {
        target: { value: '122599' }
      };

      component.formatExpiryDate(event);

      expect(event.target.value).toBe('12/25');
    });
  });

  describe('CVV Formatting', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should remove non-numeric characters', () => {
      const event = {
        target: { value: 'abc123' }
      };

      component.formatCVV(event);

      expect(event.target.value).toBe('123');
    });

    it('should limit to 4 digits', () => {
      const event = {
        target: { value: '12345' }
      };

      component.formatCVV(event);

      expect(event.target.value).toBe('1234');
      expect(event.target.value.length).toBe(4);
    });

    it('should update form control value', () => {
      const event = {
        target: { value: '123' }
      };

      component.formatCVV(event);

      expect(component.paymentForm.get('cvv')?.value).toBe('123');
    });
  });

  describe('Step Navigation', () => {
    it('should move to next step', () => {
      component.currentStep = 1;
      component.nextStep();
      expect(component.currentStep).toBe(2);
    });

    it('should not exceed total steps', () => {
      component.currentStep = 3;
      component.nextStep();
      expect(component.currentStep).toBe(3);
    });

    it('should move to previous step', () => {
      component.currentStep = 2;
      component.previousStep();
      expect(component.currentStep).toBe(1);
    });

    it('should not go below step 1', () => {
      component.currentStep = 1;
      component.previousStep();
      expect(component.currentStep).toBe(1);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.paymentForm.get('cardNumber')?.setValue('');
      component.onSubmit();

      expect(component.paymentForm.get('cardNumber')?.touched).toBe(true);
    });

    it('should not process when form is invalid', () => {
      component.onSubmit();

      expect(component.isProcessing).toBe(false);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should process valid form submission', fakeAsync(() => {
      // Set valid form values
      component.paymentForm.patchValue({
        paymentMethod: 'card',
        cardNumber: '1234567890123456',
        cardHolder: 'John Doe',
        expiryDate: '12/25',
        cvv: '123'
      });

      component.onSubmit();

      expect(component.isProcessing).toBe(true);
      expect(component.currentStep).toBe(3);

      tick(2000);

      expect(component.isProcessing).toBe(false);
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: true,
        paymentData: jasmine.any(Object)
      });
    }));

    it('should include form data in dialog result', fakeAsync(() => {
      const formData = {
        paymentMethod: 'card',
        cardNumber: '1234567890123456',
        cardHolder: 'John Doe',
        expiryDate: '12/25',
        cvv: '123',
        saveCard: false
      };

      component.paymentForm.patchValue(formData);
      component.onSubmit();

      tick(2000);

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: true,
        paymentData: formData
      });
    }));
  });

  describe('Cancel Payment', () => {
    it('should close dialog with success false', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: false });
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return required error message', () => {
      const field = component.paymentForm.get('cardNumber');
      field?.setValue('');
      field?.markAsTouched();

      expect(component.getErrorMessage('cardNumber')).toBe('This field is required');
    });

    it('should return pattern error for card number', () => {
      const field = component.paymentForm.get('cardNumber');
      field?.setValue('123');
      field?.markAsTouched();

      expect(component.getErrorMessage('cardNumber')).toBe(
        'Please enter a valid 16-digit card number'
      );
    });

    it('should return pattern error for expiry date', () => {
      const field = component.paymentForm.get('expiryDate');
      field?.setValue('13/99');
      field?.markAsTouched();

      expect(component.getErrorMessage('expiryDate')).toBe(
        'Please enter a valid date (MM/YY)'
      );
    });

    it('should return pattern error for CVV', () => {
      const field = component.paymentForm.get('cvv');
      field?.setValue('12');
      field?.markAsTouched();

      expect(component.getErrorMessage('cvv')).toBe(
        'Please enter a valid CVV (3-4 digits)'
      );
    });

    it('should return empty string for non-existent field', () => {
      expect(component.getErrorMessage('nonExistentField')).toBe('');
    });

    it('should return default error for unknown pattern error', () => {
      const field = component.paymentForm.get('cardHolder');
      field?.setValue('');
      field?.markAsTouched();

      expect(component.getErrorMessage('cardHolder')).toBe('This field is required');
    });
  });

  describe('selectedPaymentMethodLabel getter', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return correct label for card', () => {
      component.paymentForm.get('paymentMethod')?.setValue('card');
      expect(component.selectedPaymentMethodLabel).toBe('Credit/Debit Card');
    });

    it('should return correct label for paypal', () => {
      component.paymentForm.get('paymentMethod')?.setValue('paypal');
      expect(component.selectedPaymentMethodLabel).toBe('PayPal');
    });

    it('should return correct label for applepay', () => {
      component.paymentForm.get('paymentMethod')?.setValue('applepay');
      expect(component.selectedPaymentMethodLabel).toBe('Apple Pay');
    });

    it('should return correct label for googlepay', () => {
      component.paymentForm.get('paymentMethod')?.setValue('googlepay');
      expect(component.selectedPaymentMethodLabel).toBe('Google Pay');
    });

    it('should return empty string for unknown payment method', () => {
      component.paymentForm.get('paymentMethod')?.setValue('unknown');
      expect(component.selectedPaymentMethodLabel).toBe('');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should validate card number pattern', () => {
      const cardNumber = component.paymentForm.get('cardNumber');

      cardNumber?.setValue('123');
      expect(cardNumber?.hasError('pattern')).toBe(true);

      cardNumber?.setValue('1234567890123456');
      expect(cardNumber?.hasError('pattern')).toBe(false);
    });

    it('should validate expiry date pattern', () => {
      const expiryDate = component.paymentForm.get('expiryDate');

      expiryDate?.setValue('13/25');
      expect(expiryDate?.hasError('pattern')).toBe(true);

      expiryDate?.setValue('12/25');
      expect(expiryDate?.hasError('pattern')).toBe(false);
    });

    it('should validate CVV pattern', () => {
      const cvv = component.paymentForm.get('cvv');

      cvv?.setValue('12');
      expect(cvv?.hasError('pattern')).toBe(true);

      cvv?.setValue('123');
      expect(cvv?.hasError('pattern')).toBe(false);

      cvv?.setValue('1234');
      expect(cvv?.hasError('pattern')).toBe(false);
    });

    it('should validate complete form', () => {
      expect(component.paymentForm.valid).toBe(false);

      component.paymentForm.patchValue({
        paymentMethod: 'card',
        cardNumber: '1234567890123456',
        cardHolder: 'John Doe',
        expiryDate: '12/25',
        cvv: '123'
      });

      expect(component.paymentForm.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle empty card number', () => {
      const event = { target: { value: '' } };
      component.formatCardNumber(event);
      expect(event.target.value).toBe('');
    });

    it('should handle special characters in card number', () => {
      const event = { target: { value: '1234-5678-9012-3456' } };
      component.formatCardNumber(event);
      expect(event.target.value).toBe('1234567890123456');
    });

    it('should handle partial expiry date', () => {
      const event = { target: { value: '1' } };
      component.formatExpiryDate(event);
      expect(event.target.value).toBe('1');
    });

    it('should handle rapid step changes', () => {
      component.nextStep();
      component.nextStep();
      component.previousStep();
      component.nextStep();

      expect(component.currentStep).toBe(3);
    });

    it('should handle form submission during processing', fakeAsync(() => {
      component.paymentForm.patchValue({
        paymentMethod: 'card',
        cardNumber: '1234567890123456',
        cardHolder: 'John Doe',
        expiryDate: '12/25',
        cvv: '123'
      });

      component.onSubmit();
      expect(component.isProcessing).toBe(true);

      // Try to submit again
      component.onSubmit();

      tick(2000);

      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    }));
  });
});
