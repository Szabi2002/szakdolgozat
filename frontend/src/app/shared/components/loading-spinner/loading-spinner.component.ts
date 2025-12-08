import { Component, Input } from '@angular/core';
import { MaterialModule } from '@shared/material/material.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
  @Input() diameter = 50;
  @Input() height = 200;
  @Input() message = '';
}
