import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoutesService } from '../../../core/services/routes.service';

@Component({
  selector: 'app-route-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './route-form-dialog.component.html',
  styleUrl: './route-form-dialog.component.scss',
})
export class RouteFormDialogComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  mode: 'create' | 'edit' = 'create';

  constructor(
    private fb: FormBuilder,
    private routesService: RoutesService,
    private dialogRef: MatDialogRef<RouteFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.mode = this.data.mode;
    this.createForm();

    if (this.mode === 'edit' && this.data.route) {
      this.form.patchValue(this.data.route);
    }
  }

  private createForm() {
    this.form = this.fb.group({
      route_number: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      name: ['', Validators.required],
      is_accessible: [false],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    const formData = this.form.value;

    const request = this.mode === 'create'
      ? this.routesService.createRoute(formData)
      : this.routesService.updateRoute(this.data.route.id, formData);

    request.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        // console.error('Error saving route', err);
        this.isLoading = false;
      },
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
