import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { UserModel } from '../models/user-model';
import { WebSocketService } from '../services/web-socket.service';
import { Subscription } from 'rxjs';
import { FriendshipService } from '../services/friendship.service';
import { ConversationDTO, ConversationType } from '../models/conversation-model';
import { AuthService } from '../services/auth.service';
import { Message } from '../models/message';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {

  @Input() chatUser!: UserModel;
  @Output() close = new EventEmitter<void>();

  messages: any[] = [];
  newMessage = '';
  typing = false;
  isConnected = false;
  initials = '';
  conversation: ConversationDTO | null = null;

  private messageSubscription!: Subscription;
  private connectionSubscription!: Subscription;

  constructor(private webSocketService: WebSocketService,
    private friendService: FriendshipService,
    private authService: AuthService
  ) { }

  ngOnInit() {

    if (this.chatUser) {
      this.initials = (this.chatUser.firstName?.[0].toUpperCase() + this.chatUser.lastName?.[0].toUpperCase()!).toUpperCase();
    }

    this.friendService.getConverstaion([this.chatUser.id!], ConversationType.PRIVATE).subscribe({
      next: (res) => {
        this.conversation = res;
      },
      error: (e) => {
        alert("cannot get conversation")
      }
    });

    // Subscribe to incoming messages
    this.messageSubscription = this.webSocketService.onMessage().subscribe((message: Message) => {
      console.log('Received message in component:', message);
      this.messages.push({
        senderId: message.senderId || 'ME',
        content: message.content,
        type: message.contentType || 'text',
      });

      this.showTypingIndicator();
    });

    this.connectionSubscription = this.webSocketService.getConnectionStatus().subscribe((status) => {
      this.isConnected = status;
    });
  }

  ngOnDestroy() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.isConnected) return;

    this.messages.push({
      senderId: this.authService.getId()!,
      content: this.newMessage,
      type: 'text',
      sent: true,
      timestamp: new Date()
    });

    this.webSocketService.sendMessage(this.newMessage, this.conversation!);

    this.newMessage = '';
  }

  private showTypingIndicator() {
    this.typing = true;
    setTimeout(() => {
      this.typing = false;
    }, 1000);
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  closeChat() {
    this.close.emit();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}