import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FavoritesService } from '@core/services/favorites.service';

export interface SaveFavoriteDialogData {
  mode: 'create' | 'edit';
  favoriteId?: string;
  routeName?: string;
  fromStopId: string;
  fromStopName: string;
  toStopId: string;
  toStopName: string;
  routeData?: any;
}

@Component({
  selector: 'app-save-favorite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './save-favorite-dialog.component.html',
  styleUrls: ['./save-favorite-dialog.component.scss']
})
export class SaveFavoriteDialogComponent implements OnInit {
  favoriteForm!: FormGroup;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<SaveFavoriteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SaveFavoriteDialogData,
    private fb: FormBuilder,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    this.favoriteForm = this.fb.group({
      routeName: [
        this.data.routeName || '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100)
        ]
      ]
    });
  }

  get routeName() {
    return this.favoriteForm.get('routeName');
  }

  get isCreateMode(): boolean {
    return this.data.mode === 'create';
  }

  get dialogTitle(): string {
    return this.isCreateMode ? 'Mentés kedvencként' : 'Kedvenc szerkesztése';
  }

  get submitButtonText(): string {
    return this.isCreateMode ? 'Mentés' : 'Módosítások mentése';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.favoriteForm.invalid) {
      this.favoriteForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const favoriteData = {
      name: this.favoriteForm.value.routeName.trim(),
      from_stop_id: this.data.fromStopId,
      to_stop_id: this.data.toStopId,
      route_data: this.data.routeData || {}
    };

    const operation = this.isCreateMode
      ? this.favoritesService.createFavorite(favoriteData)
      : this.favoritesService.updateFavorite(
          this.data.favoriteId!,
          { name: favoriteData.name }
        );

    operation.subscribe({
      next: (favorite) => {
        this.loading = false;
        this.dialogRef.close(favorite);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }

    if (error.status === 409) {
      return 'Elérted a maximális 20 kedvenc limitet.';
    } else if (error.status === 401) {
      return 'A munkameneted lejárt. Kérlek jelentkezz be újra.';
    } else {
      return 'Nem sikerült menteni a kedvencet. Próbáld újra.';
    }
  }
}
