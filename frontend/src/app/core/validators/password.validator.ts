import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
}

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
  strength: PasswordStrength;
  color: 'red' | 'orange' | 'green';
  label: string;
  score: number;
}

/**
 * Custom validator for password requirements
 * Requires at least 1 uppercase letter and 1 number
 */
export function passwordRequirementsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Don't validate empty values (use required validator for that)
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    const passwordValid = hasUpperCase && hasNumber;

    return !passwordValid
      ? {
          passwordRequirements: {
            hasUpperCase,
            hasNumber,
            message: 'A jelszónak tartalmaznia kell legalább 1 nagybetűt és 1 számot',
          },
        }
      : null;
  };
}

/**
 * Custom validator to match two form controls (e.g., password and confirmPassword)
 */
export function matchValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);

    if (!control || !matchingControl) {
      return null;
    }

    // Don't validate if matching control has other errors
    if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
      return null;
    }

    // Set error on matchingControl if validation fails
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
      return { mustMatch: true };
    } else {
      // Clear the error if values match
      const errors = matchingControl.errors;
      if (errors) {
        delete errors['mustMatch'];
        matchingControl.setErrors(Object.keys(errors).length ? errors : null);
      }
      return null;
    }
  };
}

/**
 * Calculate password strength
 * @param password The password to evaluate
 * @returns Password strength result
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      strength: PasswordStrength.WEAK,
      color: 'red',
      label: 'Gyenge',
      score: 0,
    };
  }

  let score = 0;
  const length = password.length;

  // Length check
  if (length >= 8) score += 1;
  if (length >= 12) score += 1;

  // Character variety checks
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (hasLowerCase) score += 1;
  if (hasUpperCase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecialChar) score += 1;

  // Determine strength based on score
  if (score <= 2 || length < 8) {
    return {
      strength: PasswordStrength.WEAK,
      color: 'red',
      label: 'Gyenge',
      score,
    };
  } else if (score <= 4) {
    return {
      strength: PasswordStrength.MEDIUM,
      color: 'orange',
      label: 'Közepes',
      score,
    };
  } else {
    return {
      strength: PasswordStrength.STRONG,
      color: 'green',
      label: 'Erős',
      score,
    };
  }
}
