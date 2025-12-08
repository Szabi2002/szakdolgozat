import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '@shared/material/material.module';
import { TicketType } from '@core/services/tickets.service';

export interface PaymentData {
  ticketType: TicketType;
  routeId?: string;
  fromStopId?: string;
  toStopId?: string;
}

@Component({
  selector: 'app-payment-simulation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './payment-simulation.component.html',
  styleUrls: ['./payment-simulation.component.scss']
})
export class PaymentSimulationComponent implements OnInit {
  paymentForm!: FormGroup;
  isProcessing = false;
  currentStep = 1;
  totalSteps = 3;

  paymentMethods = [
    { value: 'card', label: 'Credit/Debit Card', icon: 'credit_card' },
    { value: 'paypal', label: 'PayPal', icon: 'account_balance_wallet' },
    { value: 'applepay', label: 'Apple Pay', icon: 'phone_iphone' },
    { value: 'googlepay', label: 'Google Pay', icon: 'phone_android' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PaymentSimulationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentData
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.paymentForm = this.fb.group({
      paymentMethod: ['card', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      cardHolder: ['', Validators.required],
      expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      saveCard: [false]
    });
  }

  get ticketPrice(): number {
    return this.data.ticketType.price;
  }

  get serviceFee(): number {
    return Math.round(this.ticketPrice * 0.02); // 2% service fee
  }

  get totalPrice(): number {
    return this.ticketPrice + this.serviceFee;
  }

  formatPrice(price: number): string {
    return `${price.toFixed(0)} Ft`;
  }

  onPaymentMethodChange(): void {
    const method = this.paymentForm.get('paymentMethod')?.value;

    // Different payment methods have different required fields
    if (method === 'card') {
      this.paymentForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
      this.paymentForm.get('cardHolder')?.setValidators([Validators.required]);
      this.paymentForm.get('expiryDate')?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
      this.paymentForm.get('cvv')?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
    } else {
      // For other payment methods, clear card-specific validators
      this.paymentForm.get('cardNumber')?.clearValidators();
      this.paymentForm.get('cardHolder')?.clearValidators();
      this.paymentForm.get('expiryDate')?.clearValidators();
      this.paymentForm.get('cvv')?.clearValidators();
    }

    this.paymentForm.get('cardNumber')?.updateValueAndValidity();
    this.paymentForm.get('cardHolder')?.updateValueAndValidity();
    this.paymentForm.get('expiryDate')?.updateValueAndValidity();
    this.paymentForm.get('cvv')?.updateValueAndValidity();
  }

  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\s/g, '');
    if (value.length > 16) {
      value = value.substring(0, 16);
    }
    event.target.value = value;
    this.paymentForm.get('cardNumber')?.setValue(value);
  }

  formatExpiryDate(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    event.target.value = value;
    this.paymentForm.get('expiryDate')?.setValue(value);
  }

  formatCVV(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    event.target.value = value;
    this.paymentForm.get('cvv')?.setValue(value);
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isProcessing = true;
    this.currentStep = 3;

    // Simulate payment processing
    setTimeout(() => {
      this.isProcessing = false;
      this.dialogRef.close({ success: true, paymentData: this.paymentForm.value });
    }, 2000);
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.paymentForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return 'This field is required';
    }
    if (field.hasError('pattern')) {
      switch (fieldName) {
        case 'cardNumber':
          return 'Please enter a valid 16-digit card number';
        case 'expiryDate':
          return 'Please enter a valid date (MM/YY)';
        case 'cvv':
          return 'Please enter a valid CVV (3-4 digits)';
        default:
          return 'Invalid format';
      }
    }
    return '';
  }

  get selectedPaymentMethodLabel(): string {
    const method = this.paymentForm.get('paymentMethod')?.value;
    const found = this.paymentMethods.find(m => m.value === method);
    return found?.label || '';
  }
}
