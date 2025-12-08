import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';
import { ChatbotService } from './chatbot.service';
import { ChatMessage } from '@core/models/chatbot.model';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
  animations: [
    trigger('fadeSlideIn', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(20px) scale(0.95)',
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)',
      })),
      transition('void => *', [
        animate('200ms ease-out'),
      ]),
      transition('* => void', [
        animate('150ms ease-in'),
      ]),
    ]),
  ],
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  private authService = inject(AuthService);
  private chatbotService = inject(ChatbotService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  isOpen = false;
  isLoading = false;
  userMessage = '';
  messages: ChatMessage[] = [];
  isAuthenticated$ = this.authService.isAuthenticated$;

  private shouldScrollToBottom = false;

  ngOnInit(): void {
    // Add welcome message when first opened
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      // Add welcome message
      this.messages.push({
        role: 'assistant',
        content: 'Szia! Miben segíthetek? Kérdezz bármit a budapesti közlekedésről, járatokról vagy megállókról.',
        timestamp: new Date(),
      });
    }
    // Focus input when opening
    if (this.isOpen) {
      setTimeout(() => {
        this.messageInput?.nativeElement?.focus();
      }, 200);
    }
  }

  sendMessage(): void {
    const message = this.userMessage.trim();
    if (!message || this.isLoading) return;

    // Add user message
    this.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    this.userMessage = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;

    // Get last 10 messages for context (excluding the one we just added)
    const history = this.messages.slice(-11, -1);

    this.chatbotService.sendMessage(message, history).subscribe({
      next: (response) => {
        this.messages.push({
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
        });
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Chatbot error:', error);
        this.messages.push({
          role: 'assistant',
          content: 'Sajnálom, hiba történt. Kérlek, próbáld újra később.',
          timestamp: new Date(),
        });
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  clearChat(): void {
    this.messages = [{
      role: 'assistant',
      content: 'Szia! Miben segíthetek? Kérdezz bármit a budapesti közlekedésről, járatokról vagy megállókról.',
      timestamp: new Date(),
    }];
  }
}
