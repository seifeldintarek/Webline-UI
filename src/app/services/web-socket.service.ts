import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Message } from '../models/message';
import { AuthService } from './auth.service';
import { ConversationDTO } from '../models/conversation-model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket!: WebSocket;
  private messageSubject = new Subject<any>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  constructor(private authService: AuthService) {
    this.connect();
  }

  connect(): void {
    this.socket = new WebSocket('ws://localhost:3000/api-ws/ws');

    this.socket.onopen = () => {
      console.log('WebSocket connection opened');
      this.connectionStatusSubject.next(true);
    };

    this.socket.onmessage = (event) => {
      alert('Received message: ' + event.data);
      try {
        const parsedMessage = JSON.parse(event.data);
        this.messageSubject.next(parsedMessage);
      } catch (e) {
        // If it's not JSON, treat as plain text
        this.messageSubject.next({
          content: event.data,
          type: 'text',
          sent: false,
          senderId: 'DJ',
          timestamp: new Date()
        });
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.connectionStatusSubject.next(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.connect(), 3000);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionStatusSubject.next(false);
    };
  }

  sendMessage(message: string, conversation: ConversationDTO): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const messageObj: Message = {
        content: message,
        senderId: this.authService.getId()!,
        conversationId: conversation.id!,
        contentType: 'text'
      };
      this.socket.send(JSON.stringify(messageObj));
    } else {
      console.warn('WebSocket is not open');
    }
  }

  onMessage(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
  }
}