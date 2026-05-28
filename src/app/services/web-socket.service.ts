import { Injectable } from '@angular/core';
import { Client, Message as StompMessage } from '@stomp/stompjs';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Message } from '../models/message';
import { AuthService } from './auth.service';
import { MessageService } from './message.service';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient!: Client;
  private messageSubject = new Subject<Message>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private subscriptions = new Map<string, any>();

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.connect();
  }

  connect(): void {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:5600/api/ws'),
      reconnectDelay: 500,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str: string) => console.log(str),
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });

    this.stompClient.onConnect = () => {
      console.log('STOMP connected');
      this.connectionStatusSubject.next(true);
    };

    this.stompClient.onStompError = (frame: any) => {
      console.error('Broker error:', frame.headers['message'], frame.body);
      this.connectionStatusSubject.next(false);
    };

    this.stompClient.onDisconnect = () => {
      console.log('STOMP disconnected');
      this.subscriptions.clear();  // stale subscriptions from dead session
      this.connectionStatusSubject.next(false);
    };

    this.stompClient.activate();
  }


  /** Formats a Date as "yyyy-MM-ddTHH:mm:ss" — matches Java LocalDateTime */
  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  sendMessage(message: string, conversationId: string): void {
    if (this.stompClient.connected) {
      const messageObj: Message = {
        id: undefined,                              // let the server generate the ID
        content: message,
        senderId: this.authService.getId()!,
        conversationId: conversationId,
        contentType: 'TEXT',
        timestamp: this.toLocalDateTimeString(new Date()),
        readBy: [],
        receivedBy: [],
        attachment: null
      };
      console.log('Sending message:', messageObj);
      this.stompClient.publish({
        destination: `/app/chat.sendMessage/${conversationId}`,
        body: JSON.stringify(messageObj),
      });
    } else {
      console.warn('STOMP is not connected');
    }
  }

  sendImageMessage(file: File, conversationId: string): void {
    if (!this.stompClient.connected) {
      console.warn('STOMP is not connected');
      return;
    }

    // Step 1: upload image to Supabase via HTTP, get back the URL
    this.messageService.uploadImage(file, conversationId).subscribe({
      next: (attachment) => {
        // Step 2: send a small STOMP frame with just the Supabase URL — no base64
        const messageObj: Message = {
          id: undefined,
          content: '',
          senderId: this.authService.getId()!,
          conversationId: conversationId,
          contentType: 'IMAGE',
          timestamp: this.toLocalDateTimeString(new Date()),
          readBy: [],
          receivedBy: [],
          attachment
        };

        console.log('Sending image message via STOMP:', messageObj);
        this.stompClient.publish({
          destination: `/app/chat.sendMessage/${conversationId}`,
          body: JSON.stringify(messageObj),
        });
      },
      error: (err) => console.error('Image upload failed:', err)
    });
  }

  // Subscribe to real-time messages for a conversation
  subscribeToConversation(conversationId: string): void {
    if (!conversationId) {
      console.warn('Cannot subscribe: conversationId is null or undefined');
      return;
    }

    // Avoid duplicate subscriptions
    if (this.subscriptions.has(conversationId)) {
      console.log(`Already subscribed to conversation: ${conversationId}`);
      return;
    }

    if (this.stompClient.connected) {
      const subscription = this.stompClient.subscribe(
        `/conversation/${conversationId}`,
        (msg: StompMessage) => {
          const data = JSON.parse(msg.body);
          console.log('Received real-time message:', data);
          this.messageSubject.next(data);
        }
      );
      this.subscriptions.set(conversationId, subscription);
      console.log(`Subscribed to conversation: ${conversationId}`);
    } else {
      console.warn('STOMP is not connected, cannot subscribe');
    }
  }

  // Unsubscribe from a conversation
  unsubscribeFromConversation(conversationId: string): void {
    const subscription = this.subscriptions.get(conversationId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(conversationId);
      console.log(`Unsubscribed from conversation: ${conversationId}`);
    }
  }

  onMessage(): Observable<Message> {
    return this.messageSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  disconnect(): void {
    if (this.stompClient) {
      // Unsubscribe from all conversations
      this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      this.subscriptions.clear();

      this.stompClient.deactivate();
    }
  }
}
