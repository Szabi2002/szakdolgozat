import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@shared/components/header/header.component';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { ChatbotComponent } from '@shared/components/chatbot/chatbot.component';
import { KeepAliveService } from '@core/services/keep-alive.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ChatbotComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Közlekedési Jegykezelő';

  constructor(private keepAlive: KeepAliveService) {}

  ngOnInit(): void {
    this.keepAlive.start();
  }
}
