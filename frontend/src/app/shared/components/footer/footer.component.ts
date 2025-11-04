import { Component } from '@angular/core';
import { MaterialModule } from '@shared/material/material.module';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MaterialModule],
  template: `
    <footer class="footer">
      <div class="container">
        <p>&copy; 2025 Közlekedési Jegykezelő - Szakdolgozat</p>
        <p>Készítette: [Neved]</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #263238;
      color: white;
      padding: 20px;
      margin-top: auto;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
    }

    p {
      margin: 5px 0;
      font-size: 0.9rem;
    }
  `],
})
export class FooterComponent {}
