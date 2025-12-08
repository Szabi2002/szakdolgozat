import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '@shared/material/material.module';

@Component({
  selector: 'app-quick-trip-planner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './quick-trip-planner.component.html',
  styleUrls: ['./quick-trip-planner.component.scss'],
})
export class QuickTripPlannerComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  tripForm: FormGroup;

  constructor() {
    this.tripForm = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      date: [new Date(), Validators.required],
      time: ['', Validators.required],
    });
  }

  /**
   * Search for routes
   */
  searchRoutes(): void {
    if (this.tripForm.valid) {
      const formValue = this.tripForm.value;

      // Navigate to trip planner with query parameters
      this.router.navigate(['/planner'], {
        queryParams: {
          from: formValue.from,
          to: formValue.to,
          date: formValue.date,
          time: formValue.time,
        },
      });
    }
  }

  /**
   * Swap from and to fields
   */
  swapLocations(): void {
    const from = this.tripForm.get('from')?.value;
    const to = this.tripForm.get('to')?.value;

    this.tripForm.patchValue({
      from: to,
      to: from,
    });
  }
}
