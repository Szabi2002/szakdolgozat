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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatSnackBarModule,
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
    private snackBar: MatSnackBar,
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
    if (this.form.invalid) {
      // Mark all fields as touched to show validation errors
      this.form.markAllAsTouched();
      this.snackBar.open('Kérlek töltsd ki helyesen az összes kötelező mezőt', 'Bezár', {
        duration: 4000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    this.isLoading = true;
    const formData = this.form.value;

    const request = this.mode === 'create'
      ? this.routesService.createRoute(formData)
      : this.routesService.updateRoute(this.data.route.id, formData);

    request.subscribe({
      next: () => {
        const successMessage = this.mode === 'create'
          ? 'Járat sikeresen létrehozva!'
          : 'Járat sikeresen frissítve!';
        this.snackBar.open(successMessage, 'Bezár', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error saving route:', err);
        this.isLoading = false;

        // Extract error message from backend response
        let errorMessage = 'Nem sikerült menteni a járatot. Próbáld újra.';

        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 409) {
          errorMessage = 'Ez a járatszám már létezik. Válassz másik számot.';
        } else if (err.status === 400) {
          errorMessage = 'Érvénytelen adatok. Ellenőrizd a mezőket.';
        } else if (err.status === 403) {
          errorMessage = 'Nincs jogosultságod ehhez a művelethez.';
        } else if (err.status === 0) {
          errorMessage = 'Kapcsolódási hiba. Ellenőrizd az internetkapcsolatot.';
        }

        this.snackBar.open(errorMessage, 'Bezár', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      },
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
