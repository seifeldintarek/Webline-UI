import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserModel } from '../models/user-model';
import { WebSocketService } from '../services/web-socket.service';
import { Subscription } from 'rxjs';
import { FriendshipService } from '../services/friendship.service';
import { ConversationDTO, ConversationType } from '../models/conversation-model';
import { AuthService } from '../services/auth.service';
import { Message } from '../models/message';
import { MessageService } from '../services/message.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  chatUser!: UserModel;
  messages: Message[] = [];
  newMessage = '';
  typing = false;
  isConnected = false;
  initials = '';
  conversation: ConversationDTO | null = null;
  currentId = this.authService.getId();
  isLoading = true;

  private messageSubscription!: Subscription;
  private connectionSubscription!: Subscription;
  private routeSubscription!: Subscription;

  constructor(
    private webSocketService: WebSocketService,
    private friendService: FriendshipService,
    private authService: AuthService,
    private userService: UserService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {

    // Subscribe to route parameter changes
    this.routeSubscription = this.route.params.subscribe(params => {
      const userId = +params['userId'];
      console.log("Loading chat for user ID:", userId);
      if (userId) {
        this.loadUser(userId);
      }
    });

    // Subscribe to connection status changes
    this.connectionSubscription = this.webSocketService.getConnectionStatus().subscribe(status => {
      this.isConnected = status;
      console.log("WebSocket connection status:", this.isConnected);

      if (this.isConnected && this.conversation) {
        this.webSocketService.subscribeToConversation(this.conversation.id!);
      }
    });

    // Subscribe to incoming real-time messages
    this.messageSubscription = this.webSocketService.onMessage().subscribe((message: Message) => {
      console.log('Received real-time message in component:', message);

      if (message.conversationId === this.conversation?.id) {
        const exists = this.messages.some(m =>
          m.timestamp === message.timestamp &&
          m.senderId === message.senderId &&
          m.content === message.content
        );

        if (!exists) {
          this.messages.push(message);
          this.showTypingIndicator();
        }
      }
    });
  }

  private loadUser(userId: number) {
    this.isLoading = true;

    // Fetch user details
    this.userService.getUserById(userId).subscribe({
      next: (user: UserModel) => {
        this.chatUser = user;
        console.log("Loaded user:", this.chatUser);

        // Set initials
        if (this.chatUser) {
          this.initials = (
            this.chatUser.firstName?.[0].toUpperCase() +
            this.chatUser.lastName?.[0].toUpperCase()!
          ).toUpperCase();
        }

        // Load conversation
        this.loadConversation();
      },
      error: (err) => {
        console.error("Error loading user:", err);
        this.router.navigate(['../'], { relativeTo: this.route });
      }
    });
  }

  private loadConversation() {
    this.friendService.getConverstaion([this.chatUser.id!], ConversationType.PRIVATE).subscribe({
      next: (conv: ConversationDTO) => {
        this.conversation = conv;
        console.log("Fetched conversation:", this.conversation);

        this.loadMessages();

        if (this.isConnected && this.conversation) {
          this.webSocketService.subscribeToConversation(this.conversation.id!);
        }
      },
      error: (err) => {
        console.error("Error fetching conversation:", err);
        this.isLoading = false;
      }
    });
  }

  private loadMessages() {
    if (this.conversation) {
      this.messageService.getMessages(this.conversation.id!).subscribe({
        next: (msgs: Message[]) => {
          this.messages = msgs;
          this.isLoading = false;
          console.log("Loaded messages via HTTP:", this.messages);
        },
        error: (err: any) => {
          console.error("Error fetching messages:", err);
          this.isLoading = false;
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.conversation) {
      this.webSocketService.unsubscribeFromConversation(this.conversation.id!);
    }

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.isConnected || !this.conversation) {
      console.warn('Cannot send message: missing requirements');
      return;
    }

    const messageContent = this.newMessage;
    this.newMessage = '';

    this.webSocketService.sendMessage(messageContent, this.conversation.id!);
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
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}