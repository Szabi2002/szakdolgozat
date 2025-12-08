import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-favorites-empty-state',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './favorites-empty-state.component.html',
  styleUrls: ['./favorites-empty-state.component.scss']
})
export class FavoritesEmptyStateComponent {
  @Output() goToPlanner = new EventEmitter<void>();

  onGoToPlanner(): void {
    this.goToPlanner.emit();
  }
}
