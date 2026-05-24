import { Injectable } from '@angular/core';
import { Client, Message as StompMessage } from '@stomp/stompjs';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Message } from '../models/message';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient!: Client;
  private messageSubject = new Subject<Message>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private subscriptions = new Map<string, any>();

  constructor(private authService: AuthService) {
    this.connect();
  }

  connect(): void {
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:5600/api-ws/ws',
      reconnectDelay: 500,
      heartbeatIncoming: 10000, // expect server heartbeat every 10s
      heartbeatOutgoing: 10000,
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getToken()}`
      },
      debug: (str: string) => console.log(str),
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
      this.connectionStatusSubject.next(false);
    };

    this.stompClient.activate();
  }

  sendMessage(message: string, conversationId: string): void {
    if (this.stompClient.connected) {
      const messageObj: Message = {
        content: message,
        senderId: this.authService.getId()!,
        conversationId: conversationId,
        contentType: 'text',
        timestamp: new Date(),
        id: '',
        readBy: [],
        receivedBy: [],
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
