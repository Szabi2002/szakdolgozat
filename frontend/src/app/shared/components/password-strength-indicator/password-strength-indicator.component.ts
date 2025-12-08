import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material/material.module';
import {
  calculatePasswordStrength,
  PasswordStrength,
  PasswordStrengthResult,
} from '@core/validators/password.validator';

@Component({
  selector: 'app-password-strength-indicator',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './password-strength-indicator.component.html',
  styleUrl: './password-strength-indicator.component.scss',
})
export class PasswordStrengthIndicatorComponent implements OnChanges {
  @Input() password: string = '';

  strengthResult: PasswordStrengthResult = {
    strength: PasswordStrength.WEAK,
    color: 'red',
    label: 'Gyenge',
    score: 0,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.strengthResult = calculatePasswordStrength(this.password);
    }
  }

  get progressValue(): number {
    return (this.strengthResult.score / 7) * 100; // Max score is 7
  }

  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.password);
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.password);
  }
}
