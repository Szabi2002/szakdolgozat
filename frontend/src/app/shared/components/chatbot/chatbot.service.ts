import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '@environments/environment';
import { ChatRequest, ChatResponse, ChatMessage } from '@core/models/chatbot.model';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/chatbot`;

  /**
   * Send a message to the chatbot and get a response
   */
  sendMessage(message: string, history: ChatMessage[] = []): Observable<ChatResponse> {
    const request: ChatRequest = {
      message,
      history: history.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    return this.http.post<ChatResponse>(`${this.apiUrl}/message`, request).pipe(
      catchError((error) => {
        console.error('[ChatbotService] Error:', error);
        return of({
          response: 'Hiba történt a kapcsolódás során. Kérlek, próbáld újra később.',
          success: false,
          error: error.message,
        });
      })
    );
  }
}
