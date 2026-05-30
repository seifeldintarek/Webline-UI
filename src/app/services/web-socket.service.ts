import { Injectable } from '@angular/core';
import { Client, Message as StompMessage } from '@stomp/stompjs';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Message, MessageType } from '../models/message';
import { AuthService } from './auth.service';
import { MessageService } from './message.service';
import SockJS from 'sockjs-client';
import { IncomingCallPayload, CallDeclinePayload } from '../models/call-types';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient!: Client;
  private messageSubject = new Subject<Message>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private subscriptions = new Map<string, any>();

  incomingCall$ = new Subject<IncomingCallPayload>();
  callDeclined$ = new Subject<CallDeclinePayload>();

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
      this.subscribeToCallEvents();   // no id needed
    };

    this.stompClient.onStompError = (frame: any) => {
      console.error('Broker error:', frame.headers['message'], frame.body);
      this.connectionStatusSubject.next(false);
    };

    this.stompClient.onDisconnect = () => {
      console.log('STOMP disconnected');
      this.subscriptions.clear();
      this.connectionStatusSubject.next(false);
    };

    this.stompClient.activate();
  }


  private subscribeToCallEvents(): void {
    this.stompClient.subscribe('/user/queue/call', (message) => {
      const payload: IncomingCallPayload = JSON.parse(message.body);
      this.incomingCall$.next(payload);
    });

    this.stompClient.subscribe('/user/queue/call.decline', (message) => {
      const payload: CallDeclinePayload = JSON.parse(message.body);
      this.callDeclined$.next(payload);
    });
  }

  initiateCall(receiverId: number, payload: IncomingCallPayload): void {
    this.stompClient.publish({
      destination: `/app/call.initiate`,
      body: JSON.stringify({ ...payload, receiverId }),
    });
  }

  declineCall(callerId: number, roomId: string, currentUserId: number): void {
    this.stompClient.publish({
      destination: `/app/call.decline`,
      body: JSON.stringify({ roomId, declinedBy: currentUserId, callerId }),
    });
  }

  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  sendMessage(message: string, conversationId: string): void {
    if (!this.stompClient.connected) {
      console.warn('STOMP is not connected');
      return;
    }

    const messageObj: Message = {
      id: undefined,
      content: message,
      senderId: this.authService.getId()!,
      conversationId,
      contentType: MessageType.TEXT,
      timestamp: this.toLocalDateTimeString(new Date()),
      readBy: [],
      receivedBy: [],
      attachment: null
    };

    this.stompClient.publish({
      destination: `/app/chat.sendMessage/${conversationId}`,
      body: JSON.stringify(messageObj),
    });
  }

  sendAttachmentMessage(file: File, conversationId: string, contentType: MessageType): void {
    if (!this.stompClient.connected) {
      console.warn('STOMP is not connected');
      return;
    }

    this.messageService.uploadFile(file, conversationId, contentType).subscribe({
      next: (attachment) => {
        const messageObj: Message = {
          id: undefined,
          content: '',
          senderId: this.authService.getId()!,
          conversationId,
          contentType,
          timestamp: this.toLocalDateTimeString(new Date()),
          readBy: [],
          receivedBy: [],
          attachment
        };

        console.log(`Sending ${contentType} message via STOMP:`, messageObj);
        this.stompClient.publish({
          destination: `/app/chat.sendMessage/${conversationId}`,
          body: JSON.stringify(messageObj),
        });
      },
      error: (err: any) => console.error(`${contentType} upload failed:`, err)
    });
  }

  subscribeToConversation(conversationId: string): void {
    if (!conversationId) {
      console.warn('Cannot subscribe: conversationId is null or undefined');
      return;
    }

    if (this.subscriptions.has(conversationId)) {
      console.log(`Already subscribed to conversation: ${conversationId}`);
      return;
    }

    if (this.stompClient.connected) {
      const subscription = this.stompClient.subscribe(
        `/conversation/${conversationId}`,
        (msg: StompMessage) => {
          const data = JSON.parse(msg.body);
          this.messageSubject.next(data);
        }
      );
      this.subscriptions.set(conversationId, subscription);
    } else {
      console.warn('STOMP is not connected, cannot subscribe');
    }
  }

  unsubscribeFromConversation(conversationId: string): void {
    const subscription = this.subscriptions.get(conversationId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(conversationId);
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
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.stompClient.deactivate();
    }
  }
}
