import { Component, Input } from '@angular/core';
import { MaterialModule } from '@shared/material/material.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  template: `
    <div class="spinner-container" [style.height.px]="height">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      <p *ngIf="message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    p {
      color: #666;
      font-size: 0.9rem;
    }
  `],
})
export class LoadingSpinnerComponent {
  @Input() diameter = 50;
  @Input() height = 200;
  @Input() message = '';
}
